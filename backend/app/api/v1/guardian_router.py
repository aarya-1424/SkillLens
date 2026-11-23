"""Parent or guardian confirmation. The two /guardian routes need no sign-in: the
private link in the email is the proof."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.guardian import service as guardian

router = APIRouter(tags=["guardian"])


class Decision(BaseModel):
    agree: bool


@router.get("/guardian/{token}")
def read_link(token: str, db: Session = Depends(get_db)) -> dict:
    return guardian.view(db, token)


@router.post("/guardian/{token}")
def answer(token: str, body: Decision, db: Session = Depends(get_db)) -> dict:
    return guardian.decide(db, token, body.agree)


@router.post("/me/guardian/resend")
def resend(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return guardian.resend(db, user.id)
