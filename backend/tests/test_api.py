from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_sports_lists_all_nine():
    res = client.get("/api/v1/sports")
    assert res.status_code == 200
    assert len(res.json()) == 9


def test_me_requires_sign_in():
    assert client.get("/api/v1/me").status_code == 401
    bad = client.get("/api/v1/me", headers={"Authorization": "Bearer not-a-token"})
    assert bad.status_code == 401
