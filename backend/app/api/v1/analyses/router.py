from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.analyses.schemas import (
    AnalysisDetail, AnalysisSummary, MetricResultOut, ProgressPoint,
    SaveAnalysisRequest, StatsOut,
)
from app.ai import coach
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.history import service
from app.movements import library

router = APIRouter(prefix="/analyses", tags=["analyses"])


def _detail(a) -> AnalysisDetail:
    return AnalysisDetail(
        id=a.id, movement_slug=a.movement_slug, sport=a.sport, movement_name=a.movement_name,
        total=a.total, grade=a.grade, injury_risk=a.injury_risk, confidence=a.confidence,
        measured=a.measured, skipped=a.skipped, created_at=a.created_at, groups=a.groups or {},
        scoring_version=a.scoring_version, unverified=a.unverified, ai_summary=a.ai_summary,
        results=[MetricResultOut(
            id=m.metric_id, name=m.name, group=m.group, layer=m.layer, unit=m.unit,
            value=m.value, value_label=m.value_label, target_label=m.target_label,
            score=m.score, severity=m.severity, status=m.status, direction=m.direction,
            amount=m.amount, headline=m.headline, cue=m.cue,
        ) for m in sorted(a.metrics, key=lambda m: m.score)],
    )


@router.post("", response_model=AnalysisDetail, status_code=status.HTTP_201_CREATED)
def save(body: SaveAnalysisRequest, user: CurrentUser = Depends(get_current_user),
         db: Session = Depends(get_db)) -> AnalysisDetail:
    """Keep a finished report, so progress over time is real."""
    if library.get(body.movement_slug) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            f"Unknown movement '{body.movement_slug}'")
    if not body.results:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "A report needs at least one check")
    saved = service.save_analysis(db, user, body)
    return _detail(service.get_analysis(db, user.id, saved.id))


@router.get("", response_model=list[AnalysisSummary])
def history(movement: str | None = Query(None), limit: int = Query(50, ge=1, le=200),
            user: CurrentUser = Depends(get_current_user),
            db: Session = Depends(get_db)) -> list[AnalysisSummary]:
    rows = service.list_analyses(db, user.id, movement=movement, limit=limit)
    return [AnalysisSummary(
        id=a.id, movement_slug=a.movement_slug, sport=a.sport, movement_name=a.movement_name,
        total=a.total, grade=a.grade, injury_risk=a.injury_risk, confidence=a.confidence,
        measured=a.measured, created_at=a.created_at) for a in rows]


@router.get("/stats", response_model=StatsOut)
def my_stats(user: CurrentUser = Depends(get_current_user),
             db: Session = Depends(get_db)) -> StatsOut:
    return StatsOut(**service.stats(db, user.id))


@router.get("/progress", response_model=list[ProgressPoint])
def my_progress(movement: str = Query(...), limit: int = Query(20, ge=2, le=100),
                user: CurrentUser = Depends(get_current_user),
                db: Session = Depends(get_db)) -> list[ProgressPoint]:
    """Scores over time for one movement — the real version of the chart."""
    return [ProgressPoint(**p) for p in service.progress(db, user.id, movement, limit)]


@router.get("/{analysis_id}", response_model=AnalysisDetail)
def one(analysis_id: str, user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)) -> AnalysisDetail:
    found = service.get_analysis(db, user.id, analysis_id)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    return _detail(found)


@router.post("/{analysis_id}/summary")
def summary(analysis_id: str, user: CurrentUser = Depends(get_current_user),
            db: Session = Depends(get_db)) -> dict:
    """A few friendly sentences about this report, written once and kept."""
    found = service.get_analysis(db, user.id, analysis_id)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    if found.ai_summary:
        return {"summary": found.ai_summary, "from_cache": True}

    text, cached = coach.summarise(db, found)
    if text is None:
        # Every model provider is down. The report is still complete without this.
        return {"summary": None, "from_cache": False, "unavailable": True}

    found.ai_summary = text
    db.commit()
    return {"summary": text, "from_cache": cached}
