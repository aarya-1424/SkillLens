"""The scoring engine must be boring and predictable. These tests hold it to that."""
import pytest

from app.movements import library
from app.movements.models import Layer
from app.scoring.engine import build_guidance, score_movement, score_value

CRICKET = library.get("cricket-bowling")
KNEE = next(m for m in CRICKET.metrics if m.id == "cricket-bowling.front_knee")  # target 155–175, tol 25


# ── the score itself ─────────────────────────────────────────────────────────

def test_inside_the_target_band_is_full_marks():
    assert score_value(KNEE, 155) == 100
    assert score_value(KNEE, 165) == 100
    assert score_value(KNEE, 175) == 100


def test_score_falls_off_steadily_outside_the_band():
    assert score_value(KNEE, 142) == pytest.approx(48.0)   # 13° under, tolerance 25
    assert score_value(KNEE, 180) == pytest.approx(80.0)   # 5° over


def test_score_never_goes_below_zero():
    assert score_value(KNEE, 50) == 0
    assert score_value(KNEE, 400) == 0


def test_same_input_always_gives_the_same_score():
    """No randomness anywhere — this is the promise we make to funders."""
    runs = {score_movement(CRICKET, {KNEE.id: 142, "cricket-bowling.trunk_lean": 24}).total
            for _ in range(5)}
    assert len(runs) == 1


def test_worse_form_scores_lower_than_better_form():
    good = score_movement(CRICKET, {KNEE.id: 165}).total
    bad = score_movement(CRICKET, {KNEE.id: 120}).total
    assert good > bad


# ── turning numbers into words ───────────────────────────────────────────────

def test_below_the_band_says_increase_and_by_how_much():
    g = build_guidance(KNEE, 142)
    assert g.status == "low"
    assert g.direction == "increase"
    assert g.delta == pytest.approx(13.0)
    assert g.amount == "13° more"
    assert g.size == "noticeably"
    assert "straighter front leg" in g.cue


def test_above_the_band_says_decrease():
    g = build_guidance(KNEE, 183)
    assert (g.status, g.direction, g.amount) == ("high", "decrease", "8° less")
    assert g.size == "a little"


def test_inside_the_band_gives_praise_and_no_correction():
    g = build_guidance(KNEE, 165)
    assert (g.status, g.direction, g.delta) == ("good", "hold", 0.0)
    assert g.cue == KNEE.cue_good


def test_size_word_grows_with_the_miss():
    assert build_guidance(KNEE, 152).size == "a touch"       # 3° out
    assert build_guidance(KNEE, 147).size == "a little"      # 8° out
    assert build_guidance(KNEE, 140).size == "noticeably"    # 15° out
    assert build_guidance(KNEE, 120).size == "a lot"         # 35° out


def test_a_side_with_no_cue_is_not_treated_as_a_fault():
    """Perfect symmetry is 0, and a faster arm is not a problem — do not penalise either."""
    sym = next(m for m in CRICKET.metrics if m.id == "cricket-bowling.shoulder_symmetry")
    assert sym.cue_low == ""                       # nothing to say below the band
    assert score_value(sym, 0) == 100              # perfectly even sides
    assert score_value(sym, 30) < 100              # lopsided still costs

    speed = next(m for m in CRICKET.metrics if m.id == "cricket-bowling.arm_speed")
    assert score_value(speed, 2000) == 100         # faster than target is fine
    assert score_value(speed, 400) < 100           # slower is not
    assert build_guidance(speed, 2000).status == "good"


def test_gauge_marks_which_sides_are_open():
    sym = next(m for m in CRICKET.metrics if m.id == "cricket-bowling.shoulder_symmetry")
    g = build_guidance(sym, 20).gauge
    assert g.open_low is True and g.open_high is False


def test_gauge_always_contains_both_the_zone_and_the_player():
    for value in (90, 142, 165, 220):
        g = build_guidance(KNEE, value).gauge
        assert g.scale_min <= g.zone_min < g.zone_max <= g.scale_max
        assert g.scale_min <= g.value <= g.scale_max


# ── the whole movement ───────────────────────────────────────────────────────

def test_unmeasured_metrics_are_skipped_not_guessed():
    r = score_movement(CRICKET, {KNEE.id: 165})
    assert r.measured == 1
    assert len(r.skipped) == len(CRICKET.metrics) - 1
    assert r.total == 100  # the one thing we could see was perfect


def test_fixes_are_listed_worst_first():
    r = score_movement(CRICKET, {
        KNEE.id: 120,                            # badly out
        "cricket-bowling.trunk_lean": 20,        # slightly out
        "cricket-bowling.arm_height": 170,       # fine
    })
    assert [f.metric.id for f in r.fixes][0] == KNEE.id
    assert all(r.fixes[i].score <= r.fixes[i + 1].score for i in range(len(r.fixes) - 1))
    assert "cricket-bowling.arm_height" in [s.metric.id for s in r.strengths]


def test_injury_risk_rises_with_serious_faults():
    assert score_movement(CRICKET, {KNEE.id: 165}).injury_risk == "Low"
    assert score_movement(CRICKET, {KNEE.id: 145}).injury_risk == "Medium"
    assert score_movement(CRICKET, {KNEE.id: 110}).injury_risk == "High"


def test_report_is_flagged_while_metrics_are_unverified():
    assert score_movement(CRICKET, {KNEE.id: 165}).unverified is True


# ── the library itself ───────────────────────────────────────────────────────

def test_ten_sports_and_swimming_is_gone():
    sports = [m.sport for m in library.all_movements()]
    assert len(sports) == 10 == len(set(sports))
    assert "Swimming" not in sports
    assert {"Badminton", "Gym & Strength"} <= set(sports)


def test_every_movement_measures_far_more_than_five_things():
    for mv in library.all_movements():
        assert len(mv.metrics) >= 6, mv.slug


def test_every_movement_covers_the_deep_layers():
    """Layers 4–6 (balance, timing, power) are what academies pay for."""
    for mv in library.all_movements():
        layers = {m.layer for m in mv.metrics}
        assert Layer.JOINT in layers, mv.slug
        assert layers & {Layer.SYMMETRY, Layer.SEQUENCE, Layer.POWER}, mv.slug


def test_weights_add_up_to_100_per_movement():
    for mv in library.all_movements():
        assert sum(m.weight for m in mv.metrics) == pytest.approx(100.0), mv.slug


def test_every_metric_can_explain_itself_in_plain_words():
    for mv in library.all_movements():
        for m in mv.metrics:
            assert m.name and m.means and m.cue_good, m.id
            # At least one side must be a real fault, with words to fix it.
            assert m.cue_low or m.cue_high, m.id
            assert m.ideal_min < m.ideal_max and m.tolerance > 0, m.id


def test_nothing_is_marked_verified_before_a_coach_signs_it_off():
    assert all(not m.verified for mv in library.all_movements() for m in mv.metrics)


def test_metric_ids_are_unique_and_namespaced_by_movement():
    ids = [m.id for mv in library.all_movements() for m in mv.metrics]
    assert len(ids) == len(set(ids))
    for mv in library.all_movements():
        assert all(m.id.startswith(mv.slug + ".") for m in mv.metrics)
