from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/sports", tags=["sports"])


class SportOut(BaseModel):
    slug: str
    name: str
    icon: str
    movement: str
    camera_view: str
    beta: bool = False


# Temporary: served from code until the sports/movements tables are filled
# from the Knowledge Library (see SkillLens Docs/05 Data Plan).
_SPORTS = [
    SportOut(slug="cricket", name="Cricket", icon="🏏", movement="Bowling action", camera_view="side"),
    SportOut(slug="basketball", name="Basketball", icon="🏀", movement="Jump shot", camera_view="side"),
    SportOut(slug="soccer", name="Soccer", icon="⚽", movement="Instep kick", camera_view="side"),
    SportOut(slug="tennis", name="Tennis", icon="🎾", movement="Serve", camera_view="side"),
    SportOut(slug="baseball", name="Baseball", icon="⚾", movement="Pitching", camera_view="side"),
    SportOut(slug="volleyball", name="Volleyball", icon="🏐", movement="Spike", camera_view="side"),
    SportOut(slug="swimming", name="Swimming", icon="🏊", movement="Freestyle stroke", camera_view="side", beta=True),
    SportOut(slug="running", name="Running", icon="🏃", movement="Running stride", camera_view="side"),
    SportOut(slug="cycling", name="Cycling", icon="🚴", movement="Pedalling", camera_view="side"),
]


@router.get("", response_model=list[SportOut])
def list_sports() -> list[SportOut]:
    return _SPORTS
