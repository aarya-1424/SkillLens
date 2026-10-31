"""The measurement model: what SkillLens actually measures in a video.

A *metric* is one measurement (one angle, one distance, one timing gap...).
Every movement has many metrics spread over six layers:

  1 JOINT      angle at a joint                     (knee, elbow, shoulder...)
  2 SEGMENT    angle of a body part vs vertical     (trunk lean, shin angle)
  3 DISTANCE   where one part sits relative to another (foot ahead of hip)
  4 SYMMETRY   the gap between left and right       (the injury predictor)
  5 SEQUENCE   the order things fire in             (hips before shoulders)
  6 POWER      speed, height, contact time

Everything is computed from the same 33 body points over time, so adding a
metric costs a row of data, not new tracking.

Each metric carries its own coaching language, because a number on its own
("142°") means nothing to a 16-year-old. See `guidance()` in scoring.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Layer(int, Enum):
    JOINT = 1
    SEGMENT = 2
    DISTANCE = 3
    SYMMETRY = 4
    SEQUENCE = 5
    POWER = 6


class Unit(str, Enum):
    DEGREES = "deg"
    CENTIMETRES = "cm"
    MILLISECONDS = "ms"
    PERCENT = "pct"
    COUNT_PER_MIN = "spm"
    DEG_PER_SEC = "deg/s"


class How(str, Enum):
    """How the value is computed from the tracked points."""

    ANGLE = "angle"              # angle at points[1], between points[0] and points[2]
    ANGLE_TO_VERTICAL = "vert"   # angle of the line points[0]->points[1] vs vertical
    ANGLE_CHANGE = "change"      # how much an angle changes between two moments
    HORIZONTAL_GAP = "hgap"      # sideways distance between two points (body-height %)
    VERTICAL_RANGE = "vrange"    # how far a point moves up and down over the clip
    LEFT_RIGHT_GAP = "lrgap"     # |left value - right value| for the same angle
    PEAK_ORDER = "order"         # time gap between the peaks of two things
    PEAK_SPEED = "speed"         # fastest rate of change of an angle
    CADENCE = "cadence"          # repeats per minute


# Key moments in a movement. The engine finds the frame each one refers to.
MOMENTS = {
    "whole_clip": "across the whole clip",
    "release": "at release",
    "contact": "at contact",
    "foot_strike": "when your foot lands",
    "lowest": "at the lowest point",
    "highest": "at the highest point",
    "trophy": "in the loaded position",
    "takeoff": "as you leave the ground",
}


@dataclass(frozen=True)
class Metric:
    """One thing we measure, and how to explain it to a player."""

    id: str
    layer: Layer
    how: How
    unit: Unit
    # Where it shows up on the report ("knee", "trunk", "balance", "power"...)
    group: str
    name: str                  # "Front knee when you land"
    means: str                 # one line: what this is, in plain words
    points: tuple[str, ...]    # body points; {lead}/{trail}/{bowl} resolved at runtime
    moment: str                # key from MOMENTS
    moment_b: str | None = None  # second moment, for ANGLE_CHANGE / PEAK_ORDER

    # The target band. Inside it = full marks.
    ideal_min: float = 0.0
    ideal_max: float = 0.0
    tolerance: float = 20.0    # how far outside the band before the score hits 0
    weight: float = 10.0       # importance inside its movement

    # Coaching language — the whole point of the product.
    cue_low: str = ""          # what to say when the value is BELOW the band
    cue_high: str = ""         # ... and ABOVE it
    cue_good: str = ""         # ... and inside it

    # Where the target band came from, and whether a coach has signed it off.
    source: str = ""
    verified: bool = False

    @property
    def movement(self) -> str:
        return self.id.split(".", 1)[0]


@dataclass(frozen=True)
class Movement:
    slug: str
    sport: str
    sport_icon: str
    name: str                  # "Bowling action"
    camera: str                # "Side view, bowling-arm side"
    tips: tuple[str, ...]
    metrics: tuple[Metric, ...] = field(default_factory=tuple)
    beta: bool = False

    def by_layer(self, layer: Layer) -> list[Metric]:
        return [m for m in self.metrics if m.layer is layer]
