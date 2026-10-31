"""A throwaway SQLite database and a signed-in user, for the tests that need them."""
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.core.auth import CurrentUser
from app.core.config import settings
from app.db.session import Base, get_engine, reset_engine
from app.history import models as _models  # noqa: F401  (registers the tables)
from app.main import app

ALICE = CurrentUser(id="user-alice", email="alice@example.com", name="Alice", avatar_url=None)
BOB = CurrentUser(id="user-bob", email="bob@example.com", name="Bob", avatar_url=None)


@pytest.fixture
def db_url(tmp_path, monkeypatch):
    url = f"sqlite:///{tmp_path / 'test.db'}"
    monkeypatch.setattr(settings, "DATABASE_URL", url)
    reset_engine()
    Base.metadata.create_all(get_engine())
    yield url
    reset_engine()


class _ClientAs:
    """A test client that signs in as one person for every call it makes.

    Two fixtures cannot each install their own dependency override — the
    second would quietly replace the first and both would act as the same
    person, which would make the privacy tests pass for the wrong reason.
    So the override reads a holder, and each client sets it per request.
    """

    def __init__(self, client, holder, user):
        self._client, self._holder, self._user = client, holder, user

    def __getattr__(self, name):
        attr = getattr(self._client, name)
        if name not in {"get", "post", "put", "patch", "delete"}:
            return attr

        def call(*args, **kwargs):
            self._holder["user"] = self._user
            return attr(*args, **kwargs)

        return call


@pytest.fixture
def _signed_in(db_url):
    holder = {"user": ALICE}
    app.dependency_overrides[get_current_user] = lambda: holder["user"]
    with TestClient(app) as c:
        yield c, holder
    app.dependency_overrides.clear()


@pytest.fixture
def client(_signed_in):
    """Signed in as Alice, with a real (temporary) database behind it."""
    c, holder = _signed_in
    return _ClientAs(c, holder, ALICE)


@pytest.fixture
def as_bob(_signed_in):
    """A second, different person — used to prove reports stay private."""
    c, holder = _signed_in
    return _ClientAs(c, holder, BOB)


@pytest.fixture
def report():
    """A believable saved report payload."""
    return {
        "movement_slug": "cricket-bowling", "sport": "Cricket", "movement_name": "Bowling action",
        "total": 74.2, "grade": "Good", "injury_risk": "Medium", "confidence": 0.89,
        "measured": 5, "skipped": 3, "groups": {"knee": 100.0, "elbow": 48.0},
        "scoring_version": "2026.10-v1", "unverified": True,
        "results": [
            {"id": "cricket-bowling.front_knee", "name": "Front knee when you land",
             "group": "knee", "layer": 1, "unit": "deg", "value": 142.0,
             "value_label": "142°", "target_label": "155° – 175°", "score": 48.0,
             "severity": "major", "status": "low", "direction": "increase",
             "amount": "13° more", "headline": "Needs about 13° more — noticeably",
             "cue": "Land on a firmer, straighter front leg."},
            {"id": "cricket-bowling.trunk_lean", "name": "Sideways lean at release",
             "group": "trunk", "layer": 2, "unit": "deg", "value": 5.0,
             "value_label": "5°", "target_label": "0° – 18°", "score": 100.0,
             "severity": "none", "status": "good", "direction": "hold",
             "amount": "", "headline": "You're in the target zone",
             "cue": "You stay nice and tall at release."},
        ],
    }
