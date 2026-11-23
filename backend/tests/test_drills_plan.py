"""Drills for every mistake, and the weekly plan rules."""
from datetime import date, timedelta
from types import SimpleNamespace

from app.drills import plan as planner
from app.drills.library import BY_ID, DRILLS, for_check
from app.movements import library
from app.scoring.engine import _open_high, _open_low
from tests.test_profile import answers


def test_every_way_a_check_can_go_wrong_has_a_drill():
    for mv in library.all_movements():
        for m in mv.metrics:
            if not _open_low(m):
                assert for_check(m.id, "low"), (m.id, "low")
            if not _open_high(m):
                assert for_check(m.id, "high"), (m.id, "high")


def test_drills_point_at_real_checks_and_are_marked_unverified():
    ids = {m.id for mv in library.all_movements() for m in mv.metrics}
    for d in DRILLS:
        assert d.steps and d.sets >= 1 and d.verified is False
        for metric_id, direction in d.fixes:
            assert metric_id in ids and direction in ("low", "high", "any")


def test_a_check_in_its_zone_gets_no_drill():
    assert for_check("badminton-smash.extension", "good") == []


def test_reports_carry_drills_for_what_needs_work(client, report):
    saved = client.post("/api/v1/analyses", json=report).json()
    knee = next(r for r in saved["results"] if r["status"] == "low")
    good = next(r for r in saved["results"] if r["status"] == "good")
    assert knee["drills"] and knee["drills"][0]["steps"]
    assert good["drills"] == []
    live = client.post("/api/v1/movements/badminton-smash/score",
                       json={"values": {"badminton-smash.extension": 140}}).json()
    assert live["fixes"][0]["drills"] and live["all_results"][0]["drills"]


def profile(**kw):
    base = dict(level="school_club", fitness="good", goal="technique", training_days=4,
                pain_now="none", pain_areas=[], past_injuries=[], goal_event=None, goal_date=None)
    base.update(kw)
    return SimpleNamespace(**base)


FIX = [planner.Fix("badminton-smash.extension", "Reach at contact", "low", "147°", "155° – 180°", 60.0),
       planner.Fix("badminton-smash.arm_speed", "Racket arm speed", "low", "785°/s", "900 – 1800°/s", 70.0)]


def test_plan_has_seven_days_with_rest_and_ends_with_filming():
    p = planner.build(profile(), FIX, "Badminton", today=date(2026, 11, 23))
    assert len(p["days"]) == 7 and p["sessions_per_week"] == 4
    kinds = [d["kind"] for d in p["days"]]
    assert kinds.count("rest") == 3 and kinds.count("film") == 1
    names = [i["id"] for d in p["days"] for i in d.get("items", [])]
    assert "bd-high-point" in names and "gen-shoulder-care" in names   # fixes + overhead care
    assert p["days"][0]["weekday"] == "Monday"


def test_seven_training_days_still_gets_a_rest_day():
    p = planner.build(profile(training_days=7), FIX, "Badminton")
    assert any(d["kind"] == "rest" for d in p["days"])
    assert any("rest day" in n for n in p["notes"])


def test_bad_pain_removes_drills_that_load_the_sore_area():
    p = planner.build(profile(pain_now="stops_me", pain_areas=["shoulder"]), FIX, "Badminton")
    assert "doctor or physiotherapist" in p["notes"][0]
    for d in p["days"]:
        for i in d.get("items", []):
            assert "shoulder" not in i["loads"]
    assert p["sessions_per_week"] <= 3


def test_mild_pain_marks_drills_instead_of_removing_them():
    p = planner.build(profile(pain_now="mild", pain_areas=["shoulder"]), FIX, "Badminton")
    flagged = [i for d in p["days"] for i in d.get("items", []) if i["caution"]]
    assert flagged and "shoulder" in flagged[0]["caution"]


def test_beginners_and_low_fitness_get_fewer_sets():
    easy = planner.build(profile(level="beginner", fitness="low"), FIX, "Badminton")
    hard = planner.build(profile(level="national_pro", fitness="very_good"), FIX, "Badminton")
    def sets(p, drill):
        return next(i["sets"] for d in p["days"] for i in d.get("items", []) if i["id"] == drill)
    assert sets(easy, "bd-high-point") < sets(hard, "bd-high-point")


def test_event_countdown_and_no_report_note():
    soon = date.today() + timedelta(days=20)
    p = planner.build(profile(goal_event="State trials", goal_date=soon), [], "Badminton")
    assert any("20 days to State trials" in n for n in p["notes"])
    assert any("Analyse a video" in n for n in p["notes"])


def test_plan_route_uses_the_latest_report_of_the_main_sport(client, report):
    assert client.get("/api/v1/me/plan").status_code == 404     # no profile yet
    client.put("/api/v1/me/profile", json=answers())            # main sport: cricket
    client.post("/api/v1/analyses", json=report)
    p = client.get("/api/v1/me/plan").json()
    assert p["sport"] == "Cricket" and p["report_id"]
    whys = [i["why"] for d in p["days"] for i in d.get("items", []) if i.get("why")]
    assert any("Front knee when you land" in w for w in whys)
