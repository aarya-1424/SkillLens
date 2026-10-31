from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_lists_ten_movements_with_their_depth():
    res = client.get("/api/v1/movements")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 10
    cricket = next(m for m in body if m["slug"] == "cricket-bowling")
    assert cricket["metric_count"] >= 8
    assert "Left/right balance" in cricket["layers"]


def test_sports_list_follows_the_library():
    body = client.get("/api/v1/sports").json()
    names = [s["name"] for s in body]
    assert len(names) == 10
    assert "Swimming" not in names
    assert "Badminton" in names and "Gym & Strength" in names
    assert all(s["metric_count"] >= 6 for s in body)


def test_movement_detail_exposes_targets_and_sources():
    body = client.get("/api/v1/movements/gym-squat").json()
    metric = next(m for m in body["metrics"] if m["id"] == "gym-squat.depth")
    assert metric["target_min"] == 70 and metric["target_max"] == 100
    assert metric["verified"] is False and metric["source"]
    assert metric["layer_name"] == "Joint angles"


def test_unknown_movement_is_a_clean_404():
    assert client.get("/api/v1/movements/kabaddi-raid").status_code == 404


def test_scoring_a_video_returns_guidance_a_player_can_act_on():
    res = client.post("/api/v1/movements/cricket-bowling/score", json={
        "values": {"cricket-bowling.front_knee": 142, "cricket-bowling.trunk_lean": 26},
    })
    assert res.status_code == 200
    body = res.json()
    assert 0 <= body["total"] <= 100
    assert body["unverified"] is True
    worst = body["fixes"][0]
    assert worst["value_label"] == "142°"
    assert worst["target_label"] == "155° – 175°"
    assert worst["direction"] == "increase"
    assert worst["amount"] == "13° more"
    assert worst["cue"]
    assert worst["gauge"]["zone_min"] == 155


def test_scoring_rejects_metrics_that_do_not_belong_to_the_movement():
    res = client.post("/api/v1/movements/cricket-bowling/score",
                      json={"values": {"gym-squat.depth": 90}})
    assert res.status_code == 422


def test_scoring_rejects_an_empty_submission():
    res = client.post("/api/v1/movements/cricket-bowling/score", json={"values": {}})
    assert res.status_code == 422
