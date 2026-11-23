"""Plateau and slipping alerts."""
import copy


def save(client, report, total, knee_score):
    r = copy.deepcopy(report)
    r["total"] = total
    r["results"][0]["score"] = knee_score
    assert client.post("/api/v1/analyses", json=r).status_code == 201


def test_needs_three_reports(client, report):
    save(client, report, 70, 48)
    save(client, report, 71, 48)
    assert client.get("/api/v1/analyses/insights").json() == []


def test_a_plateau_names_the_check_holding_it_back_with_drills(client, report):
    for t in (70.0, 71.5, 70.8):
        save(client, report, t, 48.0)
    [alert] = client.get("/api/v1/analyses/insights").json()
    assert alert["kind"] == "plateau" and alert["scores"] == [70.0, 71.5, 70.8]
    assert alert["stuck"]["name"] == "Front knee when you land"
    assert alert["stuck"]["drills"] and "Front knee" in alert["message"]


def test_slipping_beats_plateau(client, report):
    for t in (74.0, 75.0, 66.0):
        save(client, report, t, 48.0)
    assert client.get("/api/v1/analyses/insights").json()[0]["kind"] == "slipping"


def test_steady_improvement_and_high_scores_are_not_flagged_as_plateaus(client, report):
    for t in (60.0, 66.0, 72.0):
        save(client, report, t, 48.0)
    assert client.get("/api/v1/analyses/insights").json()[0]["kind"] == "improving"


def test_holding_steady_at_a_high_score_is_fine(client, report):
    for t in (90.0, 91.0, 90.5):
        save(client, report, t, 95.0)
    assert client.get("/api/v1/analyses/insights").json() == []


def test_a_check_that_did_improve_is_not_blamed(client, report):
    save(client, report, 70.0, 40.0)
    save(client, report, 71.0, 44.0)
    save(client, report, 70.5, 60.0)        # knee improved by 20: not the culprit
    [alert] = client.get("/api/v1/analyses/insights").json()
    assert alert["stuck"] is None or alert["stuck"]["name"] != "Front knee when you land"
