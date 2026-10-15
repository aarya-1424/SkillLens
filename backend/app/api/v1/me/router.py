from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.auth import CurrentUser

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
