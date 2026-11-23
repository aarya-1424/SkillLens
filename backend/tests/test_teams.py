"""Coaches and teams: who can see what, and when that stops."""
from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.core.auth import CurrentUser
from app.db.session import get_engine
from app.privacy import service as privacy
from tests.conftest import _ClientAs
from tests.test_profile import answers

CAROL = CurrentUser(id="user-carol", email="carol@example.com", name="Carol", avatar_url=None)


@pytest.fixture
def as_carol(_signed_in):
    c, holder = _signed_in
    return _ClientAs(c, holder, CAROL)


def setup_player(client, **kw):
    assert client.put("/api/v1/me/profile", json=answers(**kw)).status_code == 200


def make_team(coach, name="Under-19 squad"):
    res = coach.post("/api/v1/teams", json={"name": name, "sport_slug": "badminton-smash"})
    assert res.status_code == 201, res.text
    return res.json()


def test_a_player_must_agree_and_have_a_profile_to_join(client, as_bob):
    team = make_team(client)
    assert as_bob.post("/api/v1/teams/join", json={"code": team["invite_code"], "consent": True}).status_code == 400
    setup_player(as_bob)
    assert as_bob.post("/api/v1/teams/join", json={"code": team["invite_code"], "consent": False}).status_code == 400
    ok = as_bob.post("/api/v1/teams/join", json={"code": team["invite_code"].lower(), "consent": True})
    assert ok.status_code == 200
    preview = as_bob.get(f"/api/v1/teams/invite/{team['invite_code']}").json()
    assert preview["name"] == "Under-19 squad" and preview["players"] == 1


def test_under_18s_need_a_guardians_agreement_to_share(client, as_bob, monkeypatch):
    from app.core import mailer
    sent = []
    monkeypatch.setattr(mailer, "send", lambda to, subject, text, html=None: sent.append(text) or True)
    team = make_team(client)
    setup_player(as_bob, birth_year=date.today().year - 15, guardian_name="Parent",
                 guardian_email="parent@example.com", guardian_consent=True)
    body = {"code": team["invite_code"], "consent": True}
    assert as_bob.post("/api/v1/teams/join", json={**body, "guardian_consent": True}).status_code == 403  # parent not confirmed yet
    token = sent[-1].split("/parent/")[1].split()[0]
    as_bob.post(f"/api/v1/guardian/{token}", json={"agree": True})
    assert as_bob.post("/api/v1/teams/join", json=body).status_code == 400
    assert as_bob.post("/api/v1/teams/join", json={**body, "guardian_consent": True}).status_code == 200


def test_coach_sees_members_only_and_loses_access_when_they_leave(client, as_bob, as_carol, report):
    team = make_team(client)
    setup_player(as_bob)
    setup_player(as_carol)
    as_bob.post("/api/v1/teams/join", json={"code": team["invite_code"], "consent": True})
    bob_report = as_bob.post("/api/v1/analyses", json=report).json()
    carol_report = as_carol.post("/api/v1/analyses", json=report).json()

    squad = client.get(f"/api/v1/teams/{team['id']}").json()
    assert [p["athlete_id"] for p in squad["players"]] == ["user-bob"]
    assert squad["players"][0]["latest_total"] == 74.2
    assert "display_name" not in squad["players"][0] and "weight_kg" not in squad["players"][0]

    path = f"/api/v1/teams/{team['id']}/players"
    assert client.get(f"{path}/user-bob/reports/{bob_report['id']}").status_code == 200
    assert client.get(f"{path}/user-carol").status_code == 404                       # not a member
    assert client.get(f"{path}/user-bob/reports/{carol_report['id']}").status_code == 404

    assert as_bob.post(f"/api/v1/teams/{team['id']}/leave").status_code == 204
    assert client.get(f"{path}/user-bob/reports/{bob_report['id']}").status_code == 404
    kinds = [h["kind"] for h in as_bob.get("/api/v1/me/privacy").json()["history"]]
    assert "team_joined" in kinds and "team_left" in kinds


def test_another_coach_cannot_see_your_team(client, as_bob):
    team = make_team(client)
    assert as_bob.get(f"/api/v1/teams/{team['id']}").status_code == 404
    assert as_bob.post(f"/api/v1/teams/{team['id']}/assignments", json={"drill_id": "bd-high-point"}).status_code == 404


def test_assigned_drills_reach_the_right_players_and_can_be_ticked(client, as_bob, as_carol):
    team = make_team(client)
    for p in (as_bob, as_carol):
        setup_player(p)
        p.post("/api/v1/teams/join", json={"code": team["invite_code"], "consent": True})
    base = f"/api/v1/teams/{team['id']}/assignments"
    assert client.post(base, json={"drill_id": "nope"}).status_code == 422
    client.post(base, json={"drill_id": "bd-high-point", "note": "Every day before practice"})
    client.post(base, json={"drill_id": "bd-forearm-snap", "athlete_id": "user-bob"})

    bob = as_bob.get("/api/v1/me/assignments").json()
    carol = as_carol.get("/api/v1/me/assignments").json()
    assert len(bob) == 2 and len(carol) == 1
    team_drill = next(a for a in bob if a["athlete_id"] is None)
    assert as_bob.put(f"/api/v1/me/assignments/{team_drill['id']}", json={"done": True}).status_code == 200
    bobs_only = next(a for a in bob if a["athlete_id"] == "user-bob")
    assert as_carol.put(f"/api/v1/me/assignments/{bobs_only['id']}", json={"done": True}).status_code == 404

    coach_view = client.get(base).json()
    assert next(a for a in coach_view if a["id"] == team_drill["id"])["done_count"] == 1


def test_erasing_accounts_removes_teams_and_memberships(client, as_bob):
    team = make_team(client)
    setup_player(as_bob)
    as_bob.post("/api/v1/teams/join", json={"code": team["invite_code"], "consent": True})
    assert as_bob.get("/api/v1/me/privacy/export").json()["teams"]["member_of"][0]["name"] == "Under-19 squad"

    with Session(get_engine()) as db:
        privacy.erase(db, "user-bob")
    assert client.get(f"/api/v1/teams/{team['id']}").json()["players"] == []
    with Session(get_engine()) as db:
        privacy.erase(db, "user-alice")
    assert client.get("/api/v1/teams/mine").json()["coaching"] == []


def test_closing_a_team_and_new_codes(client, as_bob):
    team = make_team(client)
    new = client.post(f"/api/v1/teams/{team['id']}/code").json()["invite_code"]
    assert new != team["invite_code"]
    setup_player(as_bob)
    assert as_bob.post("/api/v1/teams/join", json={"code": team["invite_code"], "consent": True}).status_code == 404
    assert as_bob.post("/api/v1/teams/join", json={"code": new, "consent": True}).status_code == 200
    assert client.delete(f"/api/v1/teams/{team['id']}").status_code == 204
    assert as_bob.get("/api/v1/teams/mine").json()["member_of"] == []
