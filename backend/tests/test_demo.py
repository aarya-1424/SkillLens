"""Sample history for demo accounts."""
from app.core.config import settings


def test_only_listed_accounts_can_load_samples(client, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_EMAILS", "someone-else@example.com")
    assert client.get("/api/v1/me/demo").json()["allowed"] is False
    assert client.post("/api/v1/me/demo").status_code == 403


def test_samples_are_real_scored_reports_spread_over_weeks(client, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_EMAILS", " Alice@Example.com ")
    monkeypatch.setattr("app.ai.coach.ask", lambda *a, **k: {"unavailable": True})
    res = client.post("/api/v1/me/demo").json()
    assert res == {"reports": 8, "coach_answers": 0}

    rows = client.get("/api/v1/analyses").json()
    assert len(rows) == 8 and all(r["is_sample"] for r in rows)
    smash = client.get("/api/v1/analyses/progress?movement=badminton-smash").json()
    totals = [p["total"] for p in smash]
    assert len(totals) == 6 and totals == sorted(totals) and totals[-1] > totals[0] + 20
    detail = client.get(f"/api/v1/analyses/{smash[-1]['analysis_id']}").json()
    assert detail["results"] and all(r["cue"] for r in detail["results"])  # real coaching words

    # Loading again replaces, never doubles.
    client.post("/api/v1/me/demo")
    assert len(client.get("/api/v1/analyses").json()) == 8


def test_removing_samples_keeps_real_reports(client, report, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_EMAILS", "alice@example.com")
    monkeypatch.setattr("app.ai.coach.ask", lambda *a, **k: {"unavailable": True})
    client.post("/api/v1/analyses", json=report)
    client.post("/api/v1/me/demo")
    assert client.delete("/api/v1/me/demo").json() == {"removed": 8}
    left = client.get("/api/v1/analyses").json()
    assert len(left) == 1 and left[0]["is_sample"] is False
