"""Doing what the Privacy Policy says, not just saying it.

Every right in the policy maps to a function here:
  access & portability  -> export()
  correction            -> the profile editor (PUT /me/profile), plus request()
  erasure               -> delete_report(), clear_chat(), schedule_deletion(), erase()
  withdraw consent      -> set_ai_paused() for AI, schedule_deletion() for everything
  grievance / nominate  -> request()
and every one of them is written to the privacy log.
"""
from __future__ import annotations

import hashlib
import logging
import time
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import CurrentUser
from app.core.config import settings
from app.history.models import Analysis, AthleteProfile, ChatMessage, PrivacyRequest, Profile
from app.history.service import ensure_profile
from app.privacy.policy import (
    ACTION_KINDS, DELETION_GRACE_DAYS, POLICY_VERSION, REQUEST_KINDS, RESPONSE_DAYS,
)

log = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    """SQLite hands back naive datetimes; treat them as UTC."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def fingerprint(user_id: str) -> str:
    """A one-way stand-in for an erased person's id in the privacy log."""
    return "erased:" + hashlib.sha256(user_id.encode()).hexdigest()[:24]


def record(db: Session, user_id: str, kind: str, *, details: str | None = None,
           status: str = "done", due_by: datetime | None = None, commit: bool = True) -> PrivacyRequest:
    row = PrivacyRequest(user_id=user_id, kind=kind, details=details, status=status,
                         due_by=due_by, policy_version=POLICY_VERSION)
    db.add(row)
    if commit:
        db.commit()
        db.refresh(row)
    return row


def label(kind: str) -> str:
    return REQUEST_KINDS.get(kind) or ACTION_KINDS.get(kind) or kind


# ── what we hold, and handing it over ────────────────────────────────────────

def status(db: Session, user: CurrentUser) -> dict:
    profile = ensure_profile(db, user)
    db.commit()
    athlete = db.get(AthleteProfile, user.id)
    counts = {
        "reports": len(db.execute(select(Analysis.id).where(Analysis.user_id == user.id)).all()),
        "coach_messages": len(db.execute(select(ChatMessage.id).where(ChatMessage.user_id == user.id)).all()),
    }
    history = db.execute(
        select(PrivacyRequest).where(PrivacyRequest.user_id == user.id)
        .order_by(PrivacyRequest.created_at.desc()).limit(50)).scalars().all()
    return {
        "policy_version": POLICY_VERSION,
        "accepted_version": athlete.terms_version if athlete else None,
        "accepted_at": _aware(athlete.terms_accepted_at) if athlete else None,
        "guardian_consent_at": _aware(athlete.guardian_consent_at) if athlete else None,
        "ai_paused": bool(profile.ai_paused),
        "deletion_due_at": _aware(profile.deletion_due_at),
        "holdings": {**counts, "profile_answers": athlete is not None},
        "history": [{
            "id": r.id, "kind": r.kind, "label": label(r.kind), "status": r.status,
            "details": r.details, "due_by": _aware(r.due_by), "resolved_at": _aware(r.resolved_at),
            "resolution": r.resolution, "created_at": _aware(r.created_at),
        } for r in history],
    }


def _teams_export(db: Session, user_id: str) -> dict:
    from app.teams.service import export_for  # imported here: teams also uses this module
    return export_for(db, user_id)


def export(db: Session, user: CurrentUser) -> dict:
    """Everything we hold about this person, in one readable file."""
    profile = ensure_profile(db, user)
    athlete = db.get(AthleteProfile, user.id)
    analyses = db.execute(
        select(Analysis).where(Analysis.user_id == user.id)
        .options(selectinload(Analysis.metrics)).order_by(Analysis.created_at)).scalars().all()
    chats = db.execute(select(ChatMessage).where(ChatMessage.user_id == user.id)
                       .order_by(ChatMessage.created_at)).scalars().all()
    requests = db.execute(select(PrivacyRequest).where(PrivacyRequest.user_id == user.id)
                          .order_by(PrivacyRequest.created_at)).scalars().all()

    def cols(row, skip=()):
        out = {}
        for c in row.__table__.columns:
            if c.name in skip:
                continue
            v = getattr(row, c.name)
            out[c.name] = v.isoformat() if hasattr(v, "isoformat") else v
        return out

    bundle = {
        "about_this_file": (
            "Everything SkillLens holds about you, as of the time below. Your videos are "
            "not included because SkillLens never receives them: they are read on your own device."),
        "exported_at": _now().isoformat(),
        "policy_version": POLICY_VERSION,
        "account": cols(profile),
        "athlete_profile": cols(athlete, skip=("user_id", "guardian_token_hash")) if athlete else None,
        "reports": [{**cols(a, skip=("user_id",)),
                     "checks": [cols(m, skip=("id", "analysis_id")) for m in a.metrics]} for a in analyses],
        "ask_coach_messages": [cols(c, skip=("user_id",)) for c in chats],
        "privacy_log": [cols(r, skip=("user_id",)) for r in requests],
        "teams": _teams_export(db, user.id),
    }
    record(db, user.id, "export")
    return bundle


# ── switching AI off ─────────────────────────────────────────────────────────

def ai_paused(db: Session, user_id: str) -> bool:
    profile = db.get(Profile, user_id)
    return bool(profile and profile.ai_paused)


def set_ai_paused(db: Session, user: CurrentUser, paused: bool) -> None:
    profile = ensure_profile(db, user)
    if bool(profile.ai_paused) == paused:
        db.commit()
        return
    profile.ai_paused = paused
    record(db, user.id, "ai_paused" if paused else "ai_resumed", commit=False)
    db.commit()


# ── deleting things ──────────────────────────────────────────────────────────

def delete_report(db: Session, user_id: str, analysis_id: str) -> bool:
    found = db.execute(select(Analysis).where(
        Analysis.id == analysis_id, Analysis.user_id == user_id)).scalars().first()
    if found is None:
        return False
    db.execute(delete(ChatMessage).where(ChatMessage.user_id == user_id,
                                         ChatMessage.analysis_id == analysis_id))
    db.delete(found)
    record(db, user_id, "delete_report", commit=False)
    db.commit()
    return True


def clear_chat(db: Session, user_id: str) -> int:
    n = db.execute(delete(ChatMessage).where(ChatMessage.user_id == user_id)).rowcount or 0
    record(db, user_id, "clear_chat", commit=False)
    db.commit()
    return n


def schedule_deletion(db: Session, user: CurrentUser) -> datetime:
    profile = ensure_profile(db, user)
    if profile.deletion_due_at is None:
        profile.deletion_requested_at = _now()
        profile.deletion_due_at = _now() + timedelta(days=DELETION_GRACE_DAYS)
        record(db, user.id, "delete_requested", commit=False)
    db.commit()
    return _aware(profile.deletion_due_at)


def cancel_deletion(db: Session, user: CurrentUser) -> None:
    profile = ensure_profile(db, user)
    if profile.deletion_due_at is not None:
        profile.deletion_requested_at = None
        profile.deletion_due_at = None
        record(db, user.id, "delete_cancelled", commit=False)
    db.commit()


_KEY_CHECK = {"at": 0.0, "result": None}


def sign_in_erasure_status() -> str:
    """Can erasure also remove the Supabase sign-in record? Never reveals the key.

    "ready"        - the key is set and Supabase accepts it
    "key_missing"  - SUPABASE_SERVICE_ROLE_KEY is not set
    "key_rejected" - set, but Supabase refused it (wrong or anon key)
    "unreachable"  - could not reach Supabase to check
    Checked at most once an hour.
    """
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not key:
        return "key_missing"
    now = time.time()
    if _KEY_CHECK["result"] and now - _KEY_CHECK["at"] < 3600:
        return _KEY_CHECK["result"]
    try:
        res = httpx.get(f"{settings.SUPABASE_URL}/auth/v1/admin/users",
                        params={"page": 1, "per_page": 1},
                        headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=5)
        result = "ready" if res.status_code == 200 else "key_rejected"
    except httpx.HTTPError:
        result = "unreachable"
    _KEY_CHECK.update(at=now, result=result)
    return result


def _delete_sign_in_record(user_id: str) -> bool:
    """Remove the person from Supabase sign-in too, when we hold the key to do so."""
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if not key:
        log.warning("SUPABASE_SERVICE_ROLE_KEY not set: sign-in record for an erased "
                    "account was NOT removed from Supabase")
        return False
    try:
        res = httpx.delete(f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                           headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=10)
        return res.status_code in (200, 204, 404)
    except httpx.HTTPError:
        log.exception("Could not remove the Supabase sign-in record")
        return False


def erase(db: Session, user_id: str) -> None:
    """Permanently remove one person. Not reversible.

    The shared AI answer cache is keyed by question fingerprints and holds no
    user ids, so there is nothing of theirs to remove from it.
    """
    from app.teams.service import erase_for  # imported here: teams also uses this module
    erase_for(db, user_id)
    db.execute(delete(ChatMessage).where(ChatMessage.user_id == user_id))
    for a in db.execute(select(Analysis).where(Analysis.user_id == user_id)).scalars().all():
        db.delete(a)  # its checks go with it
    athlete = db.get(AthleteProfile, user_id)
    if athlete:
        db.delete(athlete)
    profile = db.get(Profile, user_id)
    if profile:
        db.delete(profile)

    # Keep the privacy log as proof we acted, but make it anonymous.
    stand_in = fingerprint(user_id)
    for r in db.execute(select(PrivacyRequest).where(PrivacyRequest.user_id == user_id)).scalars().all():
        r.user_id = stand_in
        r.details = None
        r.resolution = None
    db.add(PrivacyRequest(user_id=stand_in, kind="erased", policy_version=POLICY_VERSION))
    db.commit()
    _delete_sign_in_record(user_id)


def erase_due(db: Session) -> int:
    """Carry out every deletion whose 30-day window has closed."""
    due = db.execute(select(Profile.id).where(
        Profile.deletion_due_at.is_not(None), Profile.deletion_due_at <= _now())).scalars().all()
    for user_id in due:
        erase(db, user_id)
    if due:
        log.info("Erased %d account(s) whose deletion window had closed", len(due))
    return len(due)


# ── written requests and complaints ──────────────────────────────────────────

def request(db: Session, user: CurrentUser, kind: str, details: str) -> PrivacyRequest:
    ensure_profile(db, user)
    return record(db, user.id, kind, details=details, status="open",
                  due_by=_now() + timedelta(days=RESPONSE_DAYS))


def open_requests(db: Session) -> list[PrivacyRequest]:
    return db.execute(select(PrivacyRequest).where(PrivacyRequest.status == "open")
                      .order_by(PrivacyRequest.due_by)).scalars().all()


def resolve(db: Session, request_id: int, resolution: str) -> PrivacyRequest | None:
    row = db.get(PrivacyRequest, request_id)
    if row is None:
        return None
    row.status = "resolved"
    row.resolution = resolution
    row.resolved_at = _now()
    db.commit()
    return row

