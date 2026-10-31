from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai import coach as coach_ai
from app.ai import knowledge
from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.db.session import get_db
from app.history import service
from app.history.models import ChatMessage

router = APIRouter(prefix="/coach", tags=["coach"])


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    sport: str | None = None
    movement: str | None = None
    analysis_id: str | None = None


class SourceOut(BaseModel):
    id: str
    title: str
    sport: str
    verified: bool


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceOut]
    from_cache: bool
    grounded: bool
    unavailable: bool = False


@router.post("/ask", response_model=AskResponse)
def ask(body: AskRequest, user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)) -> AskResponse:
    """Ask Coach: answered from our own library, with its sources shown."""
    facts = None
    if body.analysis_id:
        found = service.get_analysis(db, user.id, body.analysis_id)
        if found is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
        worst = sorted(found.metrics, key=lambda m: m.score)[:3]
        facts = {
            "sport": found.sport, "movement": found.movement_name, "score": found.total,
            "injury_risk": found.injury_risk,
            "needs_work": [{"check": m.name, "value": m.value_label,
                            "target": m.target_label} for m in worst],
        }

    result = coach_ai.ask(db, body.question, sport=body.sport,
                          movement=body.movement, report_facts=facts)

    db.add(ChatMessage(user_id=user.id, analysis_id=body.analysis_id,
                       role="user", content=body.question))
    db.add(ChatMessage(user_id=user.id, analysis_id=body.analysis_id, role="assistant",
                       content=result["answer"], sources=result["sources"],
                       from_cache=result["from_cache"]))
    db.commit()

    return AskResponse(**{"unavailable": False, **result})


@router.get("/suggestions", response_model=list[str])
def suggestions(movement: str | None = None) -> list[str]:
    """A few questions worth asking, drawn from what this movement checks."""
    from app.movements import library

    generic = ["What does my injury risk mean?", "How often should I record myself?"]
    mv = library.get(movement) if movement else None
    if mv is None:
        return generic
    return [f"How do I improve this: {m.name.lower()}?" for m in mv.metrics[:3]] + generic


@router.get("/library-version")
def library_version() -> dict:
    """What the cache is keyed on — handy when checking a deployment."""
    return {"version": knowledge.library_version(),
            "passages": len(knowledge.all_passages())}
