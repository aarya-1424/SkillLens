"""Turns measurements into scores and into words a player can act on.

Two jobs:

1. SCORE. Inside the target band = 100. Outside, the score falls steadily to 0
   over the metric's tolerance. No randomness anywhere — the same video always
   gives the same score.

2. EXPLAIN. "142°" means nothing to a sixteen-year-old. Every measurement comes
   back with the direction to move (more or less), how much, a plain-English
   size word, the coach's cue, and the numbers a gauge needs so the player can
   SEE where they are against the target zone.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from app.movements.models import Metric, Movement, Unit

SCORING_VERSION = "2026.10-v1"

# How big does a miss feel? Thresholds per unit, from "barely" to "a lot".
_SIZE_STEPS: dict[Unit, tuple[float, float, float]] = {
    Unit.DEGREES: (5, 12, 25),
    Unit.CENTIMETRES: (3, 8, 15),
    Unit.MILLISECONDS: (20, 50, 100),
    Unit.PERCENT: (3, 8, 15),
    Unit.COUNT_PER_MIN: (5, 12, 25),
    Unit.DEG_PER_SEC: (100, 250, 500),
}
_SIZE_WORDS = ("a touch", "a little", "noticeably", "a lot")

_UNIT_LABEL = {
    Unit.DEGREES: "°",
    Unit.CENTIMETRES: " cm",
    Unit.MILLISECONDS: " ms",
    Unit.PERCENT: "%",
    Unit.COUNT_PER_MIN: " per min",
    Unit.DEG_PER_SEC: "°/s",
}

GOOD, LOW, HIGH = "good", "low", "high"


def _size_word(unit: Unit, delta: float) -> str:
    small, medium, large = _SIZE_STEPS.get(unit, (5, 12, 25))
    if delta < small:
        return _SIZE_WORDS[0]
    if delta < medium:
        return _SIZE_WORDS[1]
    if delta < large:
        return _SIZE_WORDS[2]
    return _SIZE_WORDS[3]


def fmt(unit: Unit, value: float) -> str:
    """A number a human can read: 142°, 8 cm, 172 per min."""
    digits = 0 if unit in (Unit.DEGREES, Unit.MILLISECONDS, Unit.COUNT_PER_MIN, Unit.DEG_PER_SEC) else 1
    return f"{value:.{digits}f}{_UNIT_LABEL[unit]}"


@dataclass(frozen=True)
class Gauge:
    """Everything the on-screen zone bar needs.

    `open_low` / `open_high` mean the green zone has no wall on that side, so
    the bar should fade out rather than draw a hard edge.
    """

    scale_min: float
    scale_max: float
    zone_min: float
    zone_max: float
    value: float
    open_low: bool = False
    open_high: bool = False


@dataclass(frozen=True)
class Guidance:
    status: str          # good | low | high
    direction: str       # "increase" | "decrease" | "hold"
    delta: float         # how far from the nearest edge of the target zone
    size: str            # "a little", "a lot"...
    amount: str          # "13° more"
    headline: str        # "Needs about 13° more — a little"
    cue: str             # the coach's sentence
    gauge: Gauge


@dataclass(frozen=True)
class MetricResult:
    metric: Metric
    value: float
    score: float         # 0–100
    severity: str        # none | minor | major | critical
    guidance: Guidance


@dataclass
class MovementResult:
    movement: Movement
    total: float = 0.0
    grade: str = ""
    groups: dict[str, float] = field(default_factory=dict)
    results: list[MetricResult] = field(default_factory=list)
    fixes: list[MetricResult] = field(default_factory=list)
    strengths: list[MetricResult] = field(default_factory=list)
    injury_risk: str = "Low"
    measured: int = 0
    skipped: list[str] = field(default_factory=list)
    unverified: bool = True
    scoring_version: str = SCORING_VERSION


def _open_low(metric: Metric) -> bool:
    """No cue for the low side means going under the band is not a fault.

    Perfect left/right symmetry is 0 — you cannot be 'too balanced'. Same for
    bounce, over-striding and back rounding: less is simply better.
    """
    return not metric.cue_low


def _open_high(metric: Metric) -> bool:
    """...and likewise above: faster arm speed or a higher jump is not a fault."""
    return not metric.cue_high


def score_value(metric: Metric, value: float) -> float:
    """100 inside the target band, sliding to 0 across the tolerance.

    A side with no coaching cue is open-ended, so falling off it costs nothing.
    """
    if metric.ideal_min <= value <= metric.ideal_max:
        return 100.0
    if value < metric.ideal_min:
        if _open_low(metric):
            return 100.0
        miss = metric.ideal_min - value
    else:
        if _open_high(metric):
            return 100.0
        miss = value - metric.ideal_max
    if metric.tolerance <= 0:
        return 0.0
    return round(max(0.0, 100.0 * (1.0 - miss / metric.tolerance)), 1)


def build_guidance(metric: Metric, value: float) -> Guidance:
    """The part that makes a number mean something."""
    span = max(metric.ideal_max - metric.ideal_min, 1e-6)
    pad = max(metric.tolerance, span * 0.6)
    gauge = Gauge(
        scale_min=round(min(metric.ideal_min - pad, value - pad * 0.25), 1),
        scale_max=round(max(metric.ideal_max + pad, value + pad * 0.25), 1),
        zone_min=metric.ideal_min, zone_max=metric.ideal_max, value=round(value, 1),
        open_low=_open_low(metric), open_high=_open_high(metric),
    )

    low = value < metric.ideal_min
    inside = metric.ideal_min <= value <= metric.ideal_max
    no_fault = inside or (low and _open_low(metric)) or (not low and _open_high(metric))
    if no_fault:
        return Guidance(GOOD, "hold", 0.0, "", "",
                        "You're in the target zone", metric.cue_good, gauge)

    delta = round(metric.ideal_min - value if low else value - metric.ideal_max, 1)
    size = _size_word(metric.unit, delta)
    amount = f"{fmt(metric.unit, delta)} {'more' if low else 'less'}"
    cue = (metric.cue_low if low else metric.cue_high) or metric.cue_good
    return Guidance(
        status=LOW if low else HIGH,
        direction="increase" if low else "decrease",
        delta=delta, size=size, amount=amount,
        headline=f"Needs about {amount} — {size}",
        cue=cue, gauge=gauge,
    )


def _severity(score: float) -> str:
    if score >= 85:
        return "none"
    if score >= 65:
        return "minor"
    if score >= 40:
        return "major"
    return "critical"


def _grade(total: float) -> str:
    if total >= 85:
        return "Excellent"
    if total >= 70:
        return "Good"
    if total >= 50:
        return "Needs work"
    return "Keep training"


def score_movement(movement: Movement, values: dict[str, float]) -> MovementResult:
    """Score one analysed video.

    `values` maps metric id -> measured value. A metric left out (because the
    body was not clearly visible, say) is skipped rather than guessed, and the
    remaining weights are shared out again so the total stays out of 100.
    """
    out = MovementResult(movement=movement)
    weighted, weight_total = 0.0, 0.0
    group_points: dict[str, list[tuple[float, float]]] = {}

    for metric in movement.metrics:
        value = values.get(metric.id)
        if value is None:
            out.skipped.append(metric.id)
            continue
        score = score_value(metric, float(value))
        result = MetricResult(metric, round(float(value), 1), score,
                              _severity(score), build_guidance(metric, float(value)))
        out.results.append(result)
        weighted += score * metric.weight
        weight_total += metric.weight
        group_points.setdefault(metric.group, []).append((score, metric.weight))

    out.measured = len(out.results)
    out.total = round(weighted / weight_total, 1) if weight_total else 0.0
    out.grade = _grade(out.total)
    out.groups = {
        g: round(sum(s * w for s, w in rows) / sum(w for _, w in rows), 1)
        for g, rows in group_points.items()
    }

    # Worst first: what the player should work on next.
    out.fixes = sorted(
        (r for r in out.results if r.severity != "none"),
        key=lambda r: (r.score, -r.metric.weight),
    )
    out.strengths = sorted(
        (r for r in out.results if r.severity == "none"),
        key=lambda r: -r.metric.weight,
    )[:3]

    criticals = sum(1 for r in out.results if r.severity == "critical")
    majors = sum(1 for r in out.results if r.severity == "major")
    out.injury_risk = "High" if criticals or majors >= 3 else "Medium" if majors or criticals else "Low"

    # Any unverified metric in the mix means the whole report carries the note.
    out.unverified = any(not r.metric.verified for r in out.results)
    return out
