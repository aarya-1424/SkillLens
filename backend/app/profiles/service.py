"""Reading and saving the questionnaire, and turning it into coaching context."""
from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.core.auth import CurrentUser
from app.history.models import AthleteProfile
from app.history.service import ensure_profile
from app.movements import library
from app.guardian import service as guardian
from app.privacy import service as privacy
from app.profiles.schemas import ADULT_AGE, TERMS_VERSION, ProfileIn, ProfileOut, age_on

LEVEL_WORDS = {
    "beginner": "just starting out",
    "school_club": "plays at school or club level",
    "district_state": "plays at district or state level",
    "national_pro": "plays at national or professional level",
}
GOAL_WORDS = {
    "technique": "improve their technique",
    "prevent_injury": "avoid getting injured",
    "selection": "get selected for a team",
    "comeback": "come back from an injury",
    "fitness": "get fitter",
}


def get(db: Session, user_id: str) -> AthleteProfile | None:
    return db.get(AthleteProfile, user_id)


def save(db: Session, user: CurrentUser, body: ProfileIn) -> AthleteProfile:
    ensure_profile(db, user)
    now = datetime.now(timezone.utc)
    row = db.get(AthleteProfile, user.id)
    first_time = row is None
    if first_time:
        row = AthleteProfile(user_id=user.id)
        db.add(row)

    previous_guardian_email = None if first_time else row.guardian_email
    data = body.model_dump(exclude={"accept_terms", "guardian_consent"})
    for field, value in data.items():
        setattr(row, field, value)

    if first_time or row.terms_version != TERMS_VERSION:
        row.terms_version = TERMS_VERSION
        row.terms_accepted_at = now
        privacy.record(db, user.id, "consent", commit=False,
                       details="With parent or guardian agreement" if body.guardian_consent else None)
    if body.guardian_consent:
        row.guardian_consent_at = row.guardian_consent_at or now
    else:
        row.guardian_consent_at = None

    guardian.after_profile_save(db, row, previous_guardian_email)
    db.commit()
    db.refresh(row)
    return row


def to_out(row: AthleteProfile) -> ProfileOut:
    age = age_on(date.today(), row.birth_year, row.birth_month)
    bmi = round(row.weight_kg / ((row.height_cm / 100) ** 2), 1)
    stored = {name: getattr(row, name) for name in ProfileOut.model_fields
              if name not in {"age", "is_minor", "bmi", "guardian_email_hint", "guardian_email_sent", "guardian_email_enabled"}}
    return ProfileOut(**stored, age=age, is_minor=age < ADULT_AGE, bmi=bmi,
                      guardian_email_hint=guardian.mask(row.guardian_email),
                      guardian_email_sent=row.guardian_email_sent_at is not None,
                      guardian_email_enabled=guardian.enabled())


def age_band(age: int) -> str:
    if age < 12:
        return "under 12"
    if age < 15:
        return "12 to 14"
    if age < 18:
        return "15 to 17"
    if age < 35:
        return "18 to 34"
    return "35 or over"


def coaching_context(row: AthleteProfile | None) -> dict | None:
    """The few facts that should change the advice, and nothing identifying.

    No name, no exact age, no weight: just enough for the coach to pitch the
    advice right and to be careful around sore spots. Coarse on purpose so
    similar athletes can share cached answers.
    """
    if row is None:
        return None
    age = age_on(date.today(), row.birth_year, row.birth_month)
    movement = library.get(row.sport_slug)
    ctx = {
        "age_group": age_band(age),
        "level": LEVEL_WORDS.get(row.level, row.level),
        "main_goal": GOAL_WORDS.get(row.goal, row.goal),
        "main_sport": movement.sport if movement else row.sport_slug,
        "trains_days_per_week": row.training_days,
    }
    if row.role:
        ctx["role"] = row.role
    if row.pain_now != "none" and row.pain_areas:
        ctx["sore_right_now"] = row.pain_areas
        ctx["pain_level"] = "mild" if row.pain_now == "mild" else "bad enough to stop training"
    if row.past_injuries:
        ctx["past_injuries"] = row.past_injuries
    return ctx
