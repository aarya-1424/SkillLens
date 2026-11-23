"""Demo accounts: load or remove sample history. Only for emails in DEMO_EMAILS."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.demo import seed

router = APIRouter(prefix="/me/demo", tags=["demo"])


def _check(user: CurrentUser) -> None:
    if not seed.allowed(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sample data is only for demo accounts")


@router.get("")
def demo_status(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    ok = seed.allowed(user)
    return {"allowed": ok, "sample_reports": seed.count(db, user.id) if ok else 0}


@router.post("")
def fill(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    _check(user)
    return seed.fill(db, user)


@router.delete("")
def remove(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    _check(user)
    return {"removed": seed.remove(db, user.id)}
