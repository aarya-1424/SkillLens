"""Parent or guardian confirmation by email, for athletes under 18.

The DPDP Act asks for a parent's verifiable consent before a child's data is
processed. A tick box only proves the child ticked it. So we email the parent
a private link; only someone who can read that inbox can open it. Until the
parent agrees, nothing about the child is saved: no reports, no Ask Coach, no
team sharing. (The setup answers themselves are kept so we know whom to email
and so the child does not have to start again; they can be deleted at any
time from Privacy & data like everything else.)

Links last 14 days. Only a fingerprint of the link is stored, never the link.
"""
from __future__ import annotations

import hashlib
import html as html_lib
import secrets
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import mailer
from app.core.config import settings
from app.history.models import AthleteProfile
from app.movements import library
from app.privacy import service as privacy
from app.profiles.schemas import ADULT_AGE, age_on

LINK_DAYS = 14
RESEND_GAP = timedelta(minutes=10)

NOT_NEEDED, PENDING, CONFIRMED, DECLINED = "not_needed", "pending", "confirmed", "declined"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    return dt.replace(tzinfo=timezone.utc) if dt is not None and dt.tzinfo is None else dt


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def is_minor(row: AthleteProfile) -> bool:
    return age_on(date.today(), row.birth_year, row.birth_month) < ADULT_AGE


def mask(email: str | None) -> str | None:
    if not email or "@" not in email:
        return None
    name, domain = email.split("@", 1)
    return f"{name[0]}{'*' * max(1, len(name) - 1)}@{domain}"


def _email(row: AthleteProfile, link: str) -> tuple[str, str, str]:
    first = (row.display_name or "Your child").split(" ")[0]
    movement = library.get(row.sport_slug)
    sport = movement.sport.lower() if movement else "sport"
    subject = f"Please confirm: {first} would like to use SkillLens"
    text = (
        f"Hello {row.guardian_name or ''},\n\n"
        f"{first} has signed up to SkillLens, an app that gives coaching feedback on {sport} "
        "technique from short videos, and gave your name as their parent or guardian.\n\n"
        "Because they are under 18, we need your agreement before we save anything about them.\n\n"
        f"Please open this private link to read what SkillLens keeps and to agree or not agree:\n{link}\n\n"
        f"The link works for {LINK_DAYS} days. If you do not know about this, you can ignore this email "
        "and nothing will be saved.\n\nSkillLens"
    )
    safe_link = html_lib.escape(link)
    html = (
        f"<p>Hello {html_lib.escape(row.guardian_name or '')},</p>"
        f"<p><strong>{html_lib.escape(first)}</strong> has signed up to SkillLens, an app that gives coaching "
        f"feedback on {html_lib.escape(sport)} technique from short videos, and gave your name as their parent or guardian.</p>"
        "<p>Because they are under 18, we need your agreement before we save anything about them.</p>"
        f"<p><a href=\"{safe_link}\" style=\"display:inline-block;padding:12px 20px;border-radius:999px;"
        "background:#d7282f;color:#fff;text-decoration:none;font-weight:600\">Read and decide</a></p>"
        f"<p style=\"color:#625f58;font-size:13px\">The link works for {LINK_DAYS} days. If you do not know about this, "
        "ignore this email and nothing will be saved.</p>"
    )
    return subject, text, html


def start(db: Session, row: AthleteProfile) -> bool:
    """New link, emailed to the guardian. Returns whether the email went."""
    token = secrets.token_urlsafe(32)
    row.guardian_status = PENDING
    row.guardian_token_hash = _hash(token)
    row.guardian_token_expires_at = _now() + timedelta(days=LINK_DAYS)
    row.guardian_decided_at = None
    link = f"{settings.FRONTEND_URL.rstrip('/')}/parent/{token}"
    subject, text, html = _email(row, link)
    sent = mailer.send(row.guardian_email, subject, text, html)
    row.guardian_email_sent_at = _now() if sent else None
    return sent


def after_profile_save(db: Session, row: AthleteProfile, previous_email: str | None) -> None:
    """Called by the profile save: decide whether a (new) confirmation is needed."""
    if not is_minor(row):
        row.guardian_status = NOT_NEEDED
        row.guardian_token_hash = None
        row.guardian_token_expires_at = None
        return
    email_changed = (previous_email or "").lower() != (row.guardian_email or "").lower()
    if row.guardian_status == CONFIRMED and not email_changed:
        return
    if row.guardian_status == PENDING and not email_changed:
        return
    start(db, row)


def resend(db: Session, user_id: str) -> dict:
    row = db.get(AthleteProfile, user_id)
    if row is None or row.guardian_status not in (PENDING, DECLINED):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No confirmation is waiting")
    last = _aware(row.guardian_email_sent_at)
    if last and _now() - last < RESEND_GAP:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Please wait a few minutes before sending again")
    sent = start(db, row)
    db.commit()
    return {"sent": sent, "to": mask(row.guardian_email)}


def _by_token(db: Session, token: str) -> AthleteProfile:
    row = db.execute(select(AthleteProfile).where(
        AthleteProfile.guardian_token_hash == _hash(token))).scalars().first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link is not valid. It may have been replaced by a newer one.")
    if _aware(row.guardian_token_expires_at) < _now():
        raise HTTPException(status.HTTP_410_GONE, "This link has expired. Ask your child to send a new one from the app.")
    return row


def view(db: Session, token: str) -> dict:
    row = _by_token(db, token)
    movement = library.get(row.sport_slug)
    return {
        "child": (row.display_name or "Your child").split(" ")[0],
        "sport": movement.sport if movement else None,
        "guardian_name": row.guardian_name,
        "status": row.guardian_status,
        "expires_at": _aware(row.guardian_token_expires_at),
    }


def decide(db: Session, token: str, agree: bool) -> dict:
    row = _by_token(db, token)
    row.guardian_status = CONFIRMED if agree else DECLINED
    row.guardian_decided_at = _now()
    if agree:
        row.guardian_consent_at = row.guardian_consent_at or _now()
    privacy.record(db, row.user_id, "guardian_confirmed" if agree else "guardian_declined", commit=False,
                   details=f"By email to {mask(row.guardian_email)}")
    db.commit()
    return {"status": row.guardian_status}


def enabled() -> bool:
    """Parent confirmation by email is on only when the server can send email.
    Until then ("coming soon") we rely on the agreement given at sign-up, and
    the Privacy Policy says exactly that."""
    return mailer.configured()


def blocked(db: Session, user_id: str) -> bool:
    if not enabled():
        return False
    row = db.get(AthleteProfile, user_id)
    return bool(row and row.guardian_status in (PENDING, DECLINED))


def require_allowed(db: Session, user_id: str) -> None:
    """Stops anything being saved for a child whose parent has not confirmed."""
    if blocked(db, user_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Waiting for your parent or guardian to confirm by email. Nothing is saved until they do.")
