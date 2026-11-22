from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.profiles import service as profiles
from app.profiles.schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/me", tags=["me"])


class MeResponse(BaseModel):
    id: str
    email: str | None
    name: str | None
    avatar_url: str | None


@router.get("", response_model=MeResponse)
def read_me(user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    """Who am I? Confirms the frontend's sign-in token is valid."""
    return MeResponse(**user.__dict__)


@router.get("/profile", response_model=ProfileOut)
def read_profile(user: CurrentUser = Depends(get_current_user),
                 db: Session = Depends(get_db)) -> ProfileOut:
    """The setup questionnaire answers. 404 means "not filled in yet"."""
    row = profiles.get(db, user.id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not set up yet")
    return profiles.to_out(row)


@router.put("/profile", response_model=ProfileOut)
def save_profile(body: ProfileIn, user: CurrentUser = Depends(get_current_user),
                 db: Session = Depends(get_db)) -> ProfileOut:
    """Save (or update) the questionnaire answers."""
    return profiles.to_out(profiles.save(db, user, body))
