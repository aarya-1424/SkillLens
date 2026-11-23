"""Coaches and teams. A coach only ever sees players who joined their team and agreed."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.analyses.router import _detail
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.history import service as history
from app.teams import service as teams
from app.teams.service import TeamError

router = APIRouter(tags=["teams"])


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except TeamError as e:
        raise HTTPException(e.status, e.message) from e


class NewTeam(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    sport_slug: str | None = None


class Join(BaseModel):
    code: str = Field(..., min_length=4, max_length=16)
    consent: bool = False
    guardian_consent: bool = False


class NewAssignment(BaseModel):
    drill_id: str
    athlete_id: str | None = None
    note: str | None = Field(None, max_length=300)
    due_date: date | None = None


class Done(BaseModel):
    done: bool = True


# ── for everyone ──
@router.get("/teams/mine")
def my_teams(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return teams.mine(db, user.id)


@router.get("/teams/invite/{code}")
def invite_preview(code: str, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return _run(teams.preview, db, code)


@router.post("/teams/join")
def join(body: Join, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    m = _run(teams.join, db, user, body.code, body.consent, body.guardian_consent)
    return {"team_id": m.team_id}


@router.post("/teams/{team_id}/leave", status_code=204)
def leave(team_id: str, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    _run(teams.leave, db, user.id, team_id)
    return Response(status_code=204)


@router.get("/me/assignments")
def my_assignments(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    return teams.my_assignments(db, user.id)


@router.put("/me/assignments/{assignment_id}")
def mark(assignment_id: int, body: Done, user: CurrentUser = Depends(get_current_user),
         db: Session = Depends(get_db)) -> dict:
    _run(teams.mark_done, db, user.id, assignment_id, body.done)
    return {"done": body.done}


# ── for coaches ──
@router.post("/teams", status_code=201)
def create(body: NewTeam, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    t = _run(teams.create_team, db, user, body.name, body.sport_slug)
    return {"id": t.id, "name": t.name, "invite_code": t.invite_code}


@router.get("/teams/{team_id}")
def squad(team_id: str, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return _run(teams.squad, db, user.id, team_id)


@router.delete("/teams/{team_id}", status_code=204)
def close(team_id: str, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    _run(teams.delete_team, db, user.id, team_id)
    return Response(status_code=204)


@router.post("/teams/{team_id}/code")
def rotate(team_id: str, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return {"invite_code": _run(teams.new_code, db, user.id, team_id)}


@router.get("/teams/{team_id}/players/{athlete_id}")
def player(team_id: str, athlete_id: str, user: CurrentUser = Depends(get_current_user),
           db: Session = Depends(get_db)) -> dict:
    return _run(teams.player, db, user.id, team_id, athlete_id)


@router.get("/teams/{team_id}/players/{athlete_id}/reports/{analysis_id}")
def player_report(team_id: str, athlete_id: str, analysis_id: str,
                  user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    _run(teams.coach_can_see, db, user.id, team_id, athlete_id)
    found = history.get_analysis(db, athlete_id, analysis_id)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    return _detail(found)


@router.delete("/teams/{team_id}/players/{athlete_id}", status_code=204)
def remove_player(team_id: str, athlete_id: str, user: CurrentUser = Depends(get_current_user),
                  db: Session = Depends(get_db)) -> Response:
    _run(teams.remove_player, db, user.id, team_id, athlete_id)
    return Response(status_code=204)


@router.get("/teams/{team_id}/assignments")
def assignments(team_id: str, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    return _run(teams.team_assignments, db, user.id, team_id)


@router.post("/teams/{team_id}/assignments", status_code=201)
def assign(team_id: str, body: NewAssignment, user: CurrentUser = Depends(get_current_user),
           db: Session = Depends(get_db)) -> dict:
    a = _run(teams.assign, db, user.id, team_id, body.drill_id, body.athlete_id, body.note, body.due_date)
    return {"id": a.id}


@router.delete("/teams/{team_id}/assignments/{assignment_id}", status_code=204)
def unassign(team_id: str, assignment_id: int, user: CurrentUser = Depends(get_current_user),
             db: Session = Depends(get_db)) -> Response:
    _run(teams.remove_assignment, db, user.id, team_id, assignment_id)
    return Response(status_code=204)


@router.get("/drills")
def drill_list() -> list[dict]:
    """Every drill, for the coach's 'assign a drill' picker."""
    from app.drills.library import DRILLS, as_dict
    return [as_dict(d) for d in DRILLS]
