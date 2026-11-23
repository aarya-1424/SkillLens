"""Coaches, teams and the drills they assign.

The rule that matters most: a coach can see a player's information ONLY
while that player is an active member of one of the coach's teams, and the
player joined by agreeing (with a parent or guardian's agreement too if they
are under 18). Leaving the team ends access at once. Every check below goes
through `coach_can_see`.
"""
from __future__ import annotations

import secrets
from datetime import date, datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser
from app.drills.library import BY_ID as DRILLS, as_dict
from app.history import service as history
from app.history.models import (
    Analysis, Assignment, AssignmentDone, AthleteProfile, Profile, Team, TeamMember,
)
from app.history.service import ensure_profile
from app.movements import library
from app.privacy import service as privacy
from app.privacy.policy import POLICY_VERSION
from app.profiles.schemas import ADULT_AGE, age_on
from app.profiles.service import age_band

LEVEL_LABELS = {"beginner": "Beginner", "school_club": "School or club",
                "district_state": "District or state", "national_pro": "National or pro"}

MAX_TEAMS_PER_COACH = 10
MAX_PLAYERS_PER_TEAM = 60
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # no 0/O, 1/I: easy to read out


class TeamError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_code(db: Session) -> str:
    while True:
        code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
        if not db.execute(select(Team.id).where(Team.invite_code == code)).first():
            return code


def _name_of(db: Session, user_id: str) -> str:
    athlete = db.get(AthleteProfile, user_id)
    if athlete and athlete.display_name:
        return athlete.display_name
    profile = db.get(Profile, user_id)
    return (profile.name if profile and profile.name else "Player")


def _age(db: Session, user_id: str) -> int | None:
    a = db.get(AthleteProfile, user_id)
    return age_on(date.today(), a.birth_year, a.birth_month) if a else None


# ── teams ────────────────────────────────────────────────────────────────────

def create_team(db: Session, coach: CurrentUser, name: str, sport_slug: str | None) -> Team:
    ensure_profile(db, coach)
    owned = db.execute(select(Team.id).where(Team.coach_id == coach.id)).all()
    if len(owned) >= MAX_TEAMS_PER_COACH:
        raise TeamError(400, f"You can coach up to {MAX_TEAMS_PER_COACH} teams")
    if sport_slug and library.get(sport_slug) is None:
        raise TeamError(422, "Unknown sport")
    team = Team(coach_id=coach.id, name=name.strip(), sport_slug=sport_slug, invite_code=_new_code(db))
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def coached_team(db: Session, coach_id: str, team_id: str) -> Team:
    team = db.get(Team, team_id)
    if team is None or team.coach_id != coach_id:
        raise TeamError(404, "Team not found")
    return team


def is_member(db: Session, team_id: str, athlete_id: str) -> TeamMember | None:
    return db.execute(select(TeamMember).where(
        TeamMember.team_id == team_id, TeamMember.athlete_id == athlete_id)).scalars().first()


def coach_can_see(db: Session, coach_id: str, team_id: str, athlete_id: str) -> Team:
    team = coached_team(db, coach_id, team_id)
    if not is_member(db, team_id, athlete_id):
        raise TeamError(404, "That player is not in this team")
    return team


def preview(db: Session, code: str) -> dict:
    team = db.execute(select(Team).where(Team.invite_code == code.strip().upper())).scalars().first()
    if team is None:
        raise TeamError(404, "No team with that code. Check it with your coach.")
    movement = library.get(team.sport_slug) if team.sport_slug else None
    return {"team_id": team.id, "name": team.name, "coach": _name_of(db, team.coach_id),
            "sport": movement.sport if movement else None, "players": len(team.members)}


def join(db: Session, athlete: CurrentUser, code: str, consent: bool, guardian_consent: bool) -> TeamMember:
    team = db.execute(select(Team).where(Team.invite_code == code.strip().upper())).scalars().first()
    if team is None:
        raise TeamError(404, "No team with that code. Check it with your coach.")
    if team.coach_id == athlete.id:
        raise TeamError(400, "You coach this team")
    if not consent:
        raise TeamError(400, "You need to agree to share your reports with this coach")
    ensure_profile(db, athlete)
    if db.get(AthleteProfile, athlete.id) is None:
        raise TeamError(400, "Set up your profile before joining a team")
    age = _age(db, athlete.id)
    minor = age is not None and age < ADULT_AGE
    from app.guardian import service as guardian  # imported here to keep start-up order simple
    guardian.require_allowed(db, athlete.id)
    if minor and not guardian_consent:
        raise TeamError(400, "Under 18s need their parent or guardian to agree to this sharing")
    existing = is_member(db, team.id, athlete.id)
    if existing:
        return existing
    if len(team.members) >= MAX_PLAYERS_PER_TEAM:
        raise TeamError(400, "This team is full")
    member = TeamMember(team_id=team.id, athlete_id=athlete.id, consent_version=POLICY_VERSION,
                        guardian_consent_at=_now() if minor else None)
    db.add(member)
    privacy.record(db, athlete.id, "team_joined", commit=False,
                   details=f"Shared reports with the coach of {team.name}"
                           + (" (with parent or guardian agreement)" if minor else ""))
    db.commit()
    return member


def leave(db: Session, athlete_id: str, team_id: str) -> None:
    member = is_member(db, team_id, athlete_id)
    if member is None:
        raise TeamError(404, "You are not in this team")
    team = db.get(Team, team_id)
    db.delete(member)
    privacy.record(db, athlete_id, "team_left", commit=False,
                   details=f"Stopped sharing with the coach of {team.name}")
    db.commit()


def remove_player(db: Session, coach_id: str, team_id: str, athlete_id: str) -> None:
    team = coach_can_see(db, coach_id, team_id, athlete_id)
    db.delete(is_member(db, team_id, athlete_id))
    privacy.record(db, athlete_id, "team_left", commit=False,
                   details=f"Removed from {team.name} by the coach; sharing stopped")
    db.commit()


def new_code(db: Session, coach_id: str, team_id: str) -> str:
    team = coached_team(db, coach_id, team_id)
    team.invite_code = _new_code(db)
    db.commit()
    return team.invite_code


def delete_team(db: Session, coach_id: str, team_id: str) -> None:
    team = coached_team(db, coach_id, team_id)
    for m in team.members:
        privacy.record(db, m.athlete_id, "team_left", commit=False,
                       details=f"{team.name} was closed by the coach; sharing stopped")
    db.delete(team)
    db.commit()


# ── what each side sees ──────────────────────────────────────────────────────

def mine(db: Session, user_id: str) -> dict:
    coaching = db.execute(select(Team).where(Team.coach_id == user_id)
                          .order_by(Team.created_at)).scalars().all()
    memberships = db.execute(select(TeamMember).where(TeamMember.athlete_id == user_id)).scalars().all()
    return {
        "coaching": [{"id": t.id, "name": t.name, "sport_slug": t.sport_slug, "invite_code": t.invite_code,
                      "players": len(t.members)} for t in coaching],
        "member_of": [{"id": m.team.id, "name": m.team.name, "coach": _name_of(db, m.team.coach_id),
                       "joined_at": m.consented_at} for m in memberships],
    }


def _player_card(db: Session, athlete_id: str) -> dict:
    a = db.get(AthleteProfile, athlete_id)
    s = history.stats(db, athlete_id)
    movement = library.get(s["latest_movement"]) if s.get("latest_movement") else None
    latest = db.execute(select(Analysis.injury_risk, Analysis.created_at)
                        .where(Analysis.user_id == athlete_id)
                        .order_by(Analysis.created_at.desc()).limit(1)).first()
    sore = sorted(a.pain_areas) if a and a.pain_now != "none" and a.pain_areas else []
    age = _age(db, athlete_id)
    return {
        "athlete_id": athlete_id,
        "name": _name_of(db, athlete_id),
        "age_group": age_band(age) if age is not None else None,
        "level": LEVEL_LABELS.get(a.level) if a else None,
        "role": a.role if a else None,
        "reports": s["count"],
        "latest_total": s["latest_total"],
        "latest_movement": movement.name if movement else None,
        "latest_sport": movement.sport if movement else None,
        "change_since_last": s["change_since_last"],
        "injury_risk": latest[0] if latest else None,
        "last_active": latest[1] if latest else None,
        "sore_areas": sore,
        "pain": a.pain_now if a else None,
    }


def squad(db: Session, coach_id: str, team_id: str) -> dict:
    team = coached_team(db, coach_id, team_id)
    players = [_player_card(db, m.athlete_id) for m in team.members]
    players.sort(key=lambda p: (p["latest_total"] is None, p["latest_total"] or 0))
    at_risk = [p["name"] for p in players if p["injury_risk"] == "High" or p["pain"] == "stops_me"]
    return {"id": team.id, "name": team.name, "sport_slug": team.sport_slug,
            "invite_code": team.invite_code, "players": players, "at_risk": at_risk}


def player(db: Session, coach_id: str, team_id: str, athlete_id: str) -> dict:
    coach_can_see(db, coach_id, team_id, athlete_id)
    reports = history.list_analyses(db, athlete_id, limit=100)
    return {
        **_player_card(db, athlete_id),
        "history": [{"id": r.id, "sport": r.sport, "movement_slug": r.movement_slug,
                     "movement_name": r.movement_name, "total": r.total, "grade": r.grade,
                     "injury_risk": r.injury_risk, "created_at": r.created_at,
                     "is_sample": bool(r.is_sample)} for r in reports],
    }


# ── assigned drills ──────────────────────────────────────────────────────────

def assign(db: Session, coach_id: str, team_id: str, drill_id: str, athlete_id: str | None,
           note: str | None, due: date | None) -> Assignment:
    coached_team(db, coach_id, team_id)
    if drill_id not in DRILLS:
        raise TeamError(422, "Unknown drill")
    if athlete_id:
        coach_can_see(db, coach_id, team_id, athlete_id)
    row = Assignment(team_id=team_id, athlete_id=athlete_id, drill_id=drill_id,
                     note=(note or "").strip() or None, due_date=due)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _assignment_out(db: Session, a: Assignment, done_by: set[str], viewer: str | None = None) -> dict:
    return {
        "id": a.id, "team_id": a.team_id, "drill": as_dict(DRILLS[a.drill_id]) if a.drill_id in DRILLS else None,
        "note": a.note, "due_date": a.due_date, "created_at": a.created_at,
        "for": _name_of(db, a.athlete_id) if a.athlete_id else "Whole team",
        "athlete_id": a.athlete_id, "done_count": len(done_by),
        "done": (viewer in done_by) if viewer else None,
    }


def _done_by(db: Session, assignment_id: int) -> set[str]:
    return set(db.execute(select(AssignmentDone.athlete_id)
                          .where(AssignmentDone.assignment_id == assignment_id)).scalars().all())


def team_assignments(db: Session, coach_id: str, team_id: str) -> list[dict]:
    coached_team(db, coach_id, team_id)
    rows = db.execute(select(Assignment).where(Assignment.team_id == team_id)
                      .order_by(Assignment.created_at.desc())).scalars().all()
    return [_assignment_out(db, a, _done_by(db, a.id)) for a in rows]


def remove_assignment(db: Session, coach_id: str, team_id: str, assignment_id: int) -> None:
    coached_team(db, coach_id, team_id)
    row = db.get(Assignment, assignment_id)
    if row is None or row.team_id != team_id:
        raise TeamError(404, "Not found")
    db.delete(row)
    db.commit()


def my_assignments(db: Session, athlete_id: str) -> list[dict]:
    team_ids = db.execute(select(TeamMember.team_id).where(TeamMember.athlete_id == athlete_id)).scalars().all()
    if not team_ids:
        return []
    rows = db.execute(select(Assignment).where(
        Assignment.team_id.in_(team_ids),
        (Assignment.athlete_id.is_(None)) | (Assignment.athlete_id == athlete_id),
    ).order_by(Assignment.created_at.desc())).scalars().all()
    out = []
    for a in rows:
        item = _assignment_out(db, a, _done_by(db, a.id), viewer=athlete_id)
        item["team"] = db.get(Team, a.team_id).name
        out.append(item)
    return out


def mark_done(db: Session, athlete_id: str, assignment_id: int, done: bool) -> None:
    row = db.get(Assignment, assignment_id)
    if row is None or not is_member(db, row.team_id, athlete_id) or (row.athlete_id not in (None, athlete_id)):
        raise TeamError(404, "Not found")
    existing = db.execute(select(AssignmentDone).where(
        AssignmentDone.assignment_id == assignment_id, AssignmentDone.athlete_id == athlete_id)).scalars().first()
    if done and not existing:
        db.add(AssignmentDone(assignment_id=assignment_id, athlete_id=athlete_id))
    if not done and existing:
        db.delete(existing)
    db.commit()


# ── privacy: export and erasure ──────────────────────────────────────────────

def export_for(db: Session, user_id: str) -> dict:
    data = mine(db, user_id)
    data["assigned_to_me"] = my_assignments(db, user_id)
    return data


def erase_for(db: Session, user_id: str) -> None:
    """Called when an account is erased: their teams, memberships and ticks go."""
    for team in db.execute(select(Team).where(Team.coach_id == user_id)).scalars().all():
        db.delete(team)
    db.execute(delete(TeamMember).where(TeamMember.athlete_id == user_id))
    db.execute(delete(AssignmentDone).where(AssignmentDone.athlete_id == user_id))
    db.execute(delete(Assignment).where(Assignment.athlete_id == user_id))
