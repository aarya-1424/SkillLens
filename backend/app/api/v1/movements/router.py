from fastapi import APIRouter, HTTPException, status

from app.api.v1.movements.schemas import (
    MovementDetail,
    MovementSummary,
    ScoreRequest,
    ScoreResponse,
)
from app.movements import library
from app.scoring.engine import score_movement

router = APIRouter(prefix="/movements", tags=["movements"])


@router.get("", response_model=list[MovementSummary])
def list_movements() -> list[MovementSummary]:
    """Every movement we can analyse, one per sport."""
    return [MovementSummary.of(m) for m in library.all_movements()]


@router.get("/{slug}", response_model=MovementDetail)
def get_movement(slug: str) -> MovementDetail:
    """One movement with every metric: what we measure and the target band."""
    movement = library.get(slug)
    if movement is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown movement '{slug}'")
    return MovementDetail.of(movement)


@router.post("/{slug}/score", response_model=ScoreResponse)
def score(slug: str, body: ScoreRequest) -> ScoreResponse:
    """Score a set of measurements taken from one video.

    Pose tracking runs in the browser and sends the measured values here, so
    scoring lives in one place and the same video always gives the same score.
    """
    movement = library.get(slug)
    if movement is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown movement '{slug}'")

    known = {m.id for m in movement.metrics}
    unknown = sorted(set(body.values) - known)
    if unknown:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            f"Not metrics of {slug}: {', '.join(unknown[:5])}")
    if not body.values:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "No measurements supplied")

    return ScoreResponse.of(score_movement(movement, body.values))
