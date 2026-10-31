"""Saving and reading a player's reports."""
from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import CurrentUser
from app.history.models import Analysis, AnalysisMetric, Profile


def ensure_profile(db: Session, user: CurrentUser) -> Profile:
    """Make sure the signed-in person has a row, and keep their details fresh."""
    profile = db.get(Profile, user.id)
    if profile is None:
        profile = Profile(id=user.id, email=user.email, name=user.name, avatar_url=user.avatar_url)
        db.add(profile)
    else:
        profile.email = user.email or profile.email
        profile.name = user.name or profile.name
        profile.avatar_url = user.avatar_url or profile.avatar_url
    db.flush()
    return profile


def save_analysis(db: Session, user: CurrentUser, payload) -> Analysis:
    """Write one report, with every measured check as it was shown."""
    ensure_profile(db, user)
    analysis = Analysis(
        user_id=user.id,
        movement_slug=payload.movement_slug,
        sport=payload.sport,
        movement_name=payload.movement_name,
        total=payload.total,
        grade=payload.grade,
        injury_risk=payload.injury_risk,
        confidence=payload.confidence,
        measured=payload.measured,
        skipped=payload.skipped,
        groups=payload.groups,
        scoring_version=payload.scoring_version,
        unverified=payload.unverified,
    )
    db.add(analysis)
    db.flush()

    for r in payload.results:
        db.add(AnalysisMetric(
            analysis_id=analysis.id, metric_id=r.id, name=r.name, group=r.group,
            layer=r.layer, unit=r.unit, value=r.value, value_label=r.value_label,
            target_label=r.target_label, score=r.score, severity=r.severity,
            status=r.status, direction=r.direction, amount=r.amount,
            headline=r.headline, cue=r.cue,
        ))

    db.commit()
    db.refresh(analysis)
    return analysis


def list_analyses(db: Session, user_id: str, *, movement: str | None = None,
                  limit: int = 50) -> Sequence[Analysis]:
    stmt = select(Analysis).where(Analysis.user_id == user_id)
    if movement:
        stmt = stmt.where(Analysis.movement_slug == movement)
    stmt = stmt.order_by(Analysis.created_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


def get_analysis(db: Session, user_id: str, analysis_id: str) -> Analysis | None:
    """Always scoped by user: one person can never read another's report."""
    stmt = (select(Analysis)
            .where(Analysis.id == analysis_id, Analysis.user_id == user_id)
            .options(selectinload(Analysis.metrics)))
    return db.execute(stmt).scalars().first()


def progress(db: Session, user_id: str, movement: str, limit: int = 20) -> list[dict]:
    """Scores over time for one movement, oldest first, for the chart."""
    stmt = (select(Analysis.created_at, Analysis.total, Analysis.injury_risk, Analysis.id)
            .where(Analysis.user_id == user_id, Analysis.movement_slug == movement)
            .order_by(Analysis.created_at.desc()).limit(limit))
    rows = db.execute(stmt).all()
    return [
        {"date": created.isoformat(), "total": total, "injury_risk": risk, "analysis_id": aid}
        for created, total, risk, aid in reversed(rows)
    ]


def stats(db: Session, user_id: str) -> dict:
    """The few numbers the dashboard shows at the top."""
    total_count = db.execute(
        select(func.count(Analysis.id)).where(Analysis.user_id == user_id)).scalar_one()
    latest = db.execute(
        select(Analysis).where(Analysis.user_id == user_id)
        .order_by(Analysis.created_at.desc()).limit(1)).scalars().first()

    best = db.execute(
        select(func.max(Analysis.total)).where(Analysis.user_id == user_id)).scalar()

    # Change since the previous go at the SAME movement — the honest comparison.
    change = None
    if latest:
        previous = db.execute(
            select(Analysis.total)
            .where(Analysis.user_id == user_id,
                   Analysis.movement_slug == latest.movement_slug,
                   Analysis.created_at < latest.created_at)
            .order_by(Analysis.created_at.desc()).limit(1)).scalar()
        if previous is not None:
            change = round(latest.total - previous, 1)

    return {
        "count": total_count,
        "best": round(best, 1) if best is not None else None,
        "latest_total": latest.total if latest else None,
        "latest_grade": latest.grade if latest else None,
        "latest_sport": latest.sport if latest else None,
        "latest_movement": latest.movement_slug if latest else None,
        "latest_id": latest.id if latest else None,
        "change_since_last": change,
    }
