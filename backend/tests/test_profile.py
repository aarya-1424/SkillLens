"""The setup questionnaire: saving it, its rules, privacy, and how it shapes the coach."""
from datetime import date

from app.profiles.schemas import age_on
from app.profiles.service import coaching_context

THIS_YEAR = date.today().year


def answers(**overrides):
    base = {
        "display_name": "  Aarav   K ",
        "birth_year": THIS_YEAR - 25, "birth_month": 1, "gender": "male",
        "sport_slug": "cricket-bowling", "role": "Fast bowler", "level": "district_state",
        "years_playing": "3_5", "training_days": 4,
        "dominant_hand": "right", "dominant_foot": "right",
        "height_cm": 178, "weight_kg": 70, "fitness": "good",
        "pain_now": "mild", "pain_areas": ["back", "knee", "back"],
        "past_injuries": ["ankle"], "injury_note": None,
        "goal": "selection", "goal_event": "State trials", "goal_date": None,
        "accept_terms": True,
    }
    return {**base, **overrides}


def test_no_profile_yet_is_a_404_so_the_app_knows_to_ask(client):
    assert client.get("/api/v1/me/profile").status_code == 404


def test_saving_and_reading_back_the_questionnaire(client):
    res = client.put("/api/v1/me/profile", json=answers())
    assert res.status_code == 200, res.text
    out = res.json()
    assert out["display_name"] == "Aarav K"            # spaces tidied
    assert out["pain_areas"] == ["back", "knee"]        # duplicates removed
    assert out["age"] == 25 and out["is_minor"] is False
    assert out["bmi"] == 22.1
    assert out["terms_version"]
    assert client.get("/api/v1/me/profile").json()["role"] == "Fast bowler"


def test_saving_again_updates_rather_than_duplicates(client):
    client.put("/api/v1/me/profile", json=answers())
    res = client.put("/api/v1/me/profile", json=answers(level="national_pro", training_days=6))
    assert res.status_code == 200
    again = client.get("/api/v1/me/profile").json()
    assert again["level"] == "national_pro" and again["training_days"] == 6


def test_no_pain_means_no_sore_areas_are_kept(client):
    out = client.put("/api/v1/me/profile", json=answers(pain_now="none")).json()
    assert out["pain_areas"] == []


def test_terms_must_be_accepted(client):
    res = client.put("/api/v1/me/profile", json=answers(accept_terms=False))
    assert res.status_code == 422


def test_under_18s_need_a_guardian(client):
    young = answers(birth_year=THIS_YEAR - 14)
    assert client.put("/api/v1/me/profile", json=young).status_code == 422

    ok = client.put("/api/v1/me/profile", json={
        **young, "guardian_name": "Priya K", "guardian_email": "Priya@Example.com",
        "guardian_consent": True})
    assert ok.status_code == 200, ok.text
    assert ok.json()["is_minor"] is True
    assert ok.json()["guardian_email"] == "priya@example.com"


def test_adults_do_not_keep_guardian_details(client):
    out = client.put("/api/v1/me/profile", json=answers(
        guardian_name="Someone", guardian_email="someone@example.com", guardian_consent=True)).json()
    assert out["guardian_name"] is None and out["guardian_email"] is None


def test_bad_values_are_refused(client):
    for bad in ({"sport_slug": "chess"}, {"height_cm": 20}, {"training_days": 9},
                {"level": "galactic"}, {"pain_areas": ["tail"]},
                {"birth_year": THIS_YEAR + 1}, {"guardian_email": "not-an-email",
                                                "birth_year": THIS_YEAR - 14,
                                                "guardian_name": "X", "guardian_consent": True}):
        assert client.put("/api/v1/me/profile", json=answers(**bad)).status_code == 422, bad


def test_one_persons_profile_is_private(client, as_bob):
    client.put("/api/v1/me/profile", json=answers())
    assert as_bob.get("/api/v1/me/profile").status_code == 404


def test_age_counts_from_month_of_birth():
    assert age_on(date(2026, 3, 1), 2010, 4) == 15   # birthday month not reached
    assert age_on(date(2026, 4, 1), 2010, 4) == 16


def test_coaching_context_is_coarse_and_carries_no_identity(client):
    client.put("/api/v1/me/profile", json=answers())
    from app.db.session import get_engine
    from sqlalchemy.orm import Session
    from app.history.models import AthleteProfile
    with Session(get_engine()) as db:
        ctx = coaching_context(db.get(AthleteProfile, "user-alice"))
    assert ctx["age_group"] == "18 to 34"
    assert ctx["main_goal"] == "get selected for a team"
    assert ctx["sore_right_now"] == ["back", "knee"]
    for private in ("display_name", "weight_kg", "height_cm", "birth_year", "guardian_email"):
        assert private not in ctx
