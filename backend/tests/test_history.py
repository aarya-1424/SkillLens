"""Saved reports, progress over time, and keeping one player's data private."""
import pytest


def save(client, report, **overrides):
    res = client.post("/api/v1/analyses", json={**report, **overrides})
    assert res.status_code == 201, res.text
    return res.json()


def test_saving_a_report_keeps_every_check_and_its_words(client, report):
    saved = save(client, report)
    assert saved["total"] == 74.2
    assert saved["measured"] == 5
    assert len(saved["results"]) == 2
    worst = saved["results"][0]           # worst first
    assert worst["name"] == "Front knee when you land"
    assert worst["headline"] == "Needs about 13° more — noticeably"
    assert worst["target_label"] == "155° – 175°"


def test_a_saved_report_can_be_read_back(client, report):
    saved = save(client, report)
    again = client.get(f"/api/v1/analyses/{saved['id']}").json()
    assert again["id"] == saved["id"]
    assert again["groups"] == {"knee": 100.0, "elbow": 48.0}
    assert again["unverified"] is True


def test_history_lists_newest_first_and_filters_by_movement(client, report):
    save(client, report, total=60.0)
    save(client, report, total=80.0)
    save(client, report, movement_slug="running-stride", sport="Running",
         movement_name="Running stride", total=70.0)

    everything = client.get("/api/v1/analyses").json()
    assert len(everything) == 3

    cricket = client.get("/api/v1/analyses?movement=cricket-bowling").json()
    assert len(cricket) == 2
    assert all(a["movement_slug"] == "cricket-bowling" for a in cricket)


def test_progress_is_oldest_first_so_the_chart_reads_left_to_right(client, report):
    for score in (58.0, 64.0, 71.0):
        save(client, report, total=score)
    points = client.get("/api/v1/analyses/progress?movement=cricket-bowling").json()
    assert [p["total"] for p in points] == [58.0, 64.0, 71.0]


def test_progress_only_covers_the_movement_asked_for(client, report):
    save(client, report, total=58.0)
    save(client, report, movement_slug="gym-squat", sport="Gym & Strength",
         movement_name="Squat", total=90.0)
    points = client.get("/api/v1/analyses/progress?movement=gym-squat").json()
    assert [p["total"] for p in points] == [90.0]


def test_stats_compare_against_the_last_go_at_the_same_movement(client, report):
    save(client, report, total=60.0)
    save(client, report, total=72.5)
    stats = client.get("/api/v1/analyses/stats").json()
    assert stats["count"] == 2
    assert stats["best"] == 72.5
    assert stats["latest_total"] == 72.5
    assert stats["change_since_last"] == 12.5


def test_stats_are_empty_and_calm_for_a_new_player(client):
    stats = client.get("/api/v1/analyses/stats").json()
    assert stats == {"count": 0, "best": None, "latest_total": None, "latest_grade": None,
                     "latest_sport": None, "latest_movement": None, "latest_id": None,
                     "change_since_last": None}


def test_one_player_cannot_read_another_players_report(client, as_bob, report):
    mine = save(client, report)
    assert as_bob.get(f"/api/v1/analyses/{mine['id']}").status_code == 404
    assert as_bob.get("/api/v1/analyses").json() == []


def test_a_report_for_an_unknown_movement_is_refused(client, report):
    res = client.post("/api/v1/analyses", json={**report, "movement_slug": "judo-throw"})
    assert res.status_code == 422


def test_a_report_with_no_checks_is_refused(client, report):
    res = client.post("/api/v1/analyses", json={**report, "results": []})
    assert res.status_code == 422


def test_missing_report_is_a_clean_404(client):
    assert client.get("/api/v1/analyses/does-not-exist").status_code == 404


def test_history_says_so_plainly_when_no_database_is_configured(monkeypatch):
    from fastapi.testclient import TestClient

    from app.api.deps import get_current_user
    from app.core.config import settings
    from app.main import app
    from tests.conftest import ALICE

    monkeypatch.setattr(settings, "DATABASE_URL", None)
    app.dependency_overrides[get_current_user] = lambda: ALICE
    try:
        res = TestClient(app).get("/api/v1/analyses/stats")
        assert res.status_code == 503
        assert "not switched on" in res.json()["detail"]
    finally:
        app.dependency_overrides.clear()
