"""Sample history for a demo account, so the app can be shown to people.

Only accounts listed in DEMO_EMAILS (set on the server) can use this. Every
sample report goes through the real scoring engine, so the scores, targets
and coaching words are exactly what the app would produce for those
measurements. Sample reports are marked `is_sample`, labelled "Sample" in the
app, and can all be removed with one button.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.ai import coach
from app.api.v1.analyses.schemas import MetricResultIn, SaveAnalysisRequest
from app.api.v1.movements.schemas import MetricResultOut
from app.core.auth import CurrentUser
from app.core.config import settings
from app.history import service as history
from app.history.models import Analysis, ChatMessage
from app.movements import library
from app.scoring.engine import score_movement

# An athlete getting steadily better at the badminton smash over six weeks,
# and starting squats in the gym. (days ago, measured values)
SESSIONS: dict[str, list[tuple[int, dict[str, float]]]] = {
    "badminton-smash": [
        # Scores come out about 53, 60, 65, 71, 75, 79: real, believable progress
        # with a few things still to work on.
        (40, {"elbow_cock": 124, "extension": 139, "shoulder_turn": 4, "leg_load": 163, "hip_shoulder": 4, "arm_speed": 650}),
        (33, {"elbow_cock": 122, "extension": 141, "shoulder_turn": 5, "leg_load": 160, "hip_shoulder": 6, "arm_speed": 690}),
        (26, {"elbow_cock": 120, "extension": 143, "shoulder_turn": 5, "leg_load": 158, "hip_shoulder": 8, "arm_speed": 715}),
        (19, {"elbow_cock": 118, "extension": 145, "shoulder_turn": 6, "leg_load": 156, "hip_shoulder": 10, "arm_speed": 740}),
        (11, {"elbow_cock": 117, "extension": 146, "shoulder_turn": 7, "leg_load": 154, "hip_shoulder": 11, "arm_speed": 760}),
        (3, {"elbow_cock": 115, "extension": 147, "shoulder_turn": 7, "leg_load": 153, "hip_shoulder": 13, "arm_speed": 785}),
    ],
    "gym-squat": [
        # About 56 then 74.
        (24, {"depth": 114, "trunk_angle": 53, "back_round": 17, "knee_travel": 15, "hip_rise": 125, "knee_symmetry": 11, "shin_angle": 47}),
        (6, {"depth": 109, "trunk_angle": 50, "back_round": 14, "knee_travel": 13, "hip_rise": 108, "knee_symmetry": 9, "shin_angle": 44}),
    ],
}

# Asked of the real Ask Coach, so the answers and their sources are genuine.
QUESTIONS = [
    ("badminton-smash", "How do I get more height and a steeper angle on my smash?"),
    ("badminton-smash", "What drill helps me get a faster forearm snap?"),
]


def allowed(user: CurrentUser) -> bool:
    emails = {e.strip().lower() for e in (settings.DEMO_EMAILS or "").split(",") if e.strip()}
    return bool(user.email) and user.email.lower() in emails


def count(db: Session, user_id: str) -> int:
    return len(db.execute(select(Analysis.id).where(
        Analysis.user_id == user_id, Analysis.is_sample.is_(True))).all())


def remove(db: Session, user_id: str) -> int:
    ids = db.execute(select(Analysis.id).where(
        Analysis.user_id == user_id, Analysis.is_sample.is_(True))).scalars().all()
    if ids:
        db.execute(delete(ChatMessage).where(ChatMessage.user_id == user_id,
                                             ChatMessage.analysis_id.in_(ids)))
        for a in db.execute(select(Analysis).where(Analysis.id.in_(ids))).scalars().all():
            db.delete(a)
    db.commit()
    return len(ids)


def _payload(slug: str, values: dict[str, float], confidence: float) -> SaveAnalysisRequest:
    movement = library.get(slug)
    result = score_movement(movement, {f"{slug}.{k}": v for k, v in values.items()})
    keep = set(MetricResultIn.model_fields)
    return SaveAnalysisRequest(
        movement_slug=slug, sport=movement.sport, movement_name=movement.name,
        total=result.total, grade=result.grade, injury_risk=result.injury_risk,
        confidence=round(confidence, 2), measured=result.measured, skipped=len(result.skipped),
        groups=result.groups, scoring_version=result.scoring_version, unverified=result.unverified,
        results=[MetricResultIn(**MetricResultOut.of(r).model_dump(include=keep)) for r in result.results],
    )


def fill(db: Session, user: CurrentUser, *, ask_coach: bool = True) -> dict:
    """Replace any earlier sample history with a fresh one."""
    remove(db, user.id)
    now = datetime.now(timezone.utc)
    made: dict[str, list[str]] = {}
    for slug, sessions in SESSIONS.items():
        for i, (days_ago, values) in enumerate(sessions):
            saved = history.save_analysis(db, user, _payload(slug, values, 0.86 + 0.012 * i))
            saved.is_sample = True
            saved.created_at = now - timedelta(days=days_ago, hours=2 * i)
            db.commit()
            made.setdefault(slug, []).append(saved.id)

    asked = 0
    if ask_coach:
        latest = made["badminton-smash"][-1]
        for slug, question in QUESTIONS:
            movement = library.get(slug)
            res = coach.ask(db, question, sport=movement.sport, movement=slug)
            if res.get("unavailable"):
                break  # the AI is down right now; the reports still stand without it
            db.add(ChatMessage(user_id=user.id, analysis_id=latest, role="user", content=question))
            db.add(ChatMessage(user_id=user.id, analysis_id=latest, role="assistant",
                               content=res["answer"], sources=res["sources"],
                               from_cache=res["from_cache"]))
            db.commit()
            asked += 1
    return {"reports": sum(len(v) for v in made.values()), "coach_answers": asked}
