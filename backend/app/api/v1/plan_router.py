"""This week's training plan, built from the latest report and the setup answers."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.drills import plan as planner
from app.history.models import Analysis
from app.movements import library
from app.profiles import service as profiles

router = APIRouter(prefix="/me/plan", tags=["plan"])


def _latest(db: Session, user_id: str, slug: str | None) -> Analysis | None:
    stmt = (select(Analysis).where(Analysis.user_id == user_id)
            .options(selectinload(Analysis.metrics)).order_by(Analysis.created_at.desc()).limit(1))
    if slug:
        stmt = stmt.where(Analysis.movement_slug == slug)
    return db.execute(stmt).scalars().first()


@router.get("")
def my_plan(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    athlete = profiles.get(db, user.id)
    if athlete is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Set up your profile first")
    report = _latest(db, user.id, athlete.sport_slug) or _latest(db, user.id, None)
    slug = report.movement_slug if report else athlete.sport_slug
    movement = library.get(slug)
    fixes = []
    if report:
        fixes = [planner.Fix(m.metric_id, m.name, m.status, m.value_label, m.target_label, m.score)
                 for m in sorted(report.metrics, key=lambda m: m.score) if m.status in ("low", "high")]
    out = planner.build(athlete, fixes, movement.sport if movement else "",
                        report_date=report.created_at.isoformat() if report else None)
    out["movement"] = movement.name if movement else None
    out["report_id"] = report.id if report else None
    return out
