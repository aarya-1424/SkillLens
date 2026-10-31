from fastapi import APIRouter
from pydantic import BaseModel

from app.movements import library

router = APIRouter(prefix="/sports", tags=["sports"])


class SportOut(BaseModel):
    slug: str
    name: str
    icon: str
    movement: str
    movement_slug: str
    camera_view: str
    metric_count: int
    beta: bool = False


@router.get("", response_model=list[SportOut])
def list_sports() -> list[SportOut]:
    """The sports shown on the picker. Derived from the movement library."""
    return [
        SportOut(
            slug=m.sport.lower().replace(" & ", "-").replace(" ", "-"),
            name=m.sport, icon=m.sport_icon, movement=m.name, movement_slug=m.slug,
            camera_view=m.camera, metric_count=len(m.metrics), beta=m.beta,
        )
        for m in library.all_movements()
    ]
