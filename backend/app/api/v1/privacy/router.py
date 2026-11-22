"""Privacy & data: the buttons behind every right in the Privacy Policy."""
import json
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.privacy import service
from app.privacy.policy import DELETION_GRACE_DAYS, RESPONSE_DAYS

router = APIRouter(prefix="/me/privacy", tags=["privacy"])


class AiSwitch(BaseModel):
    paused: bool


class Confirm(BaseModel):
    confirm: bool = False


class WrittenRequest(BaseModel):
    kind: Literal["grievance", "correction", "nominate", "question", "guardian"]
    details: str = Field(..., min_length=10, max_length=2000)


@router.get("")
def read_status(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    """What we hold, your consents, your switches, and every request you have made."""
    return service.status(db, user)


@router.get("/export")
def download(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    """Right to access and portability: everything we hold, as one file."""
    bundle = service.export(db, user)
    name = f"skilllens-my-data-{datetime.now():%Y-%m-%d}.json"
    return Response(json.dumps(bundle, indent=2, ensure_ascii=False, default=str),
                    media_type="application/json",
                    headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.put("/ai")
def switch_ai(body: AiSwitch, user: CurrentUser = Depends(get_current_user),
              db: Session = Depends(get_db)) -> dict:
    """Withdraw (or give back) consent to sending your report facts to the AI model."""
    service.set_ai_paused(db, user, body.paused)
    return {"ai_paused": body.paused}


@router.delete("/chat")
def clear_chat(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return {"deleted": service.clear_chat(db, user.id)}


@router.delete("/account")
def delete_account(body: Confirm, user: CurrentUser = Depends(get_current_user),
                   db: Session = Depends(get_db)) -> dict:
    """Erasure, with a change-of-mind window. Needs an explicit confirm."""
    if not body.confirm:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Confirm account deletion to continue")
    due = service.schedule_deletion(db, user)
    return {"deletion_due_at": due,
            "message": f"Your account will be deleted on {due:%d %b %Y}. "
                       f"You have {DELETION_GRACE_DAYS} days to change your mind."}


@router.post("/account/cancel")
def cancel_deletion(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    service.cancel_deletion(db, user)
    return {"deletion_due_at": None, "message": "Deletion cancelled. Everything is as you left it."}


@router.post("/requests", status_code=status.HTTP_201_CREATED)
def make_request(body: WrittenRequest, user: CurrentUser = Depends(get_current_user),
                 db: Session = Depends(get_db)) -> dict:
    """Complaints and requests that need a person to answer them."""
    row = service.request(db, user, body.kind, body.details.strip())
    return {"id": row.id, "due_by": service._aware(row.due_by),
            "message": f"Received. We will reply within {RESPONSE_DAYS} days."}
