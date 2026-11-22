"""What a valid questionnaire answer looks like.

The allowed values here are the single list the frontend's option keys must
match (frontend/src/data/profileQuestions.js). Labels live in the frontend;
the backend only cares about the keys.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.movements import library
from app.privacy.policy import POLICY_VERSION

TERMS_VERSION = POLICY_VERSION
_EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
ADULT_AGE = 18

Gender = Literal["male", "female", "other", "prefer_not"]
Level = Literal["beginner", "school_club", "district_state", "national_pro"]
Years = Literal["lt1", "1_3", "3_5", "5_plus"]
Side = Literal["right", "left", "both"]
Fitness = Literal["low", "average", "good", "very_good"]
Pain = Literal["none", "mild", "stops_me"]
Goal = Literal["technique", "prevent_injury", "selection", "comeback", "fitness"]
Area = Literal[
    "neck", "shoulder", "elbow", "wrist", "back", "hip", "groin",
    "hamstring", "knee", "shin", "ankle", "foot", "other",
]


def age_on(today: date, year: int, month: int) -> int:
    """Whole years old, from month and year of birth (we never ask the day)."""
    years = today.year - year
    return years - 1 if today.month < month else years


class ProfileIn(BaseModel):
    # About you
    display_name: str = Field(..., min_length=1, max_length=60)
    birth_year: int = Field(..., ge=1940)
    birth_month: int = Field(..., ge=1, le=12)
    gender: Gender

    # Your sport
    sport_slug: str
    role: str | None = Field(None, max_length=60)
    level: Level
    years_playing: Years
    training_days: int = Field(..., ge=0, le=7)
    dominant_hand: Side
    dominant_foot: Side

    # Your body
    height_cm: float = Field(..., ge=100, le=230)
    weight_kg: float = Field(..., ge=20, le=200)
    fitness: Fitness
    pain_now: Pain
    pain_areas: list[Area] = Field(default_factory=list, max_length=13)
    past_injuries: list[Area] = Field(default_factory=list, max_length=13)
    injury_note: str | None = Field(None, max_length=300)

    # Your goal
    goal: Goal
    goal_event: str | None = Field(None, max_length=80)
    goal_date: date | None = None

    # Consent
    accept_terms: bool
    guardian_name: str | None = Field(None, max_length=120)
    guardian_email: str | None = Field(None, max_length=320)
    guardian_consent: bool = False

    @field_validator("display_name", "role", "injury_note", "goal_event", "guardian_name")
    @classmethod
    def _tidy(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = " ".join(v.split())
        return v or None

    @field_validator("guardian_email")
    @classmethod
    def _email(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        v = v.strip().lower()
        if not _EMAIL.fullmatch(v):
            raise ValueError("That email address does not look right")
        return v

    @field_validator("sport_slug")
    @classmethod
    def _known_sport(cls, v: str) -> str:
        if library.get(v) is None:
            raise ValueError("Unknown sport")
        return v

    @model_validator(mode="after")
    def _rules(self) -> "ProfileIn":
        today = date.today()
        if (self.birth_year, self.birth_month) > (today.year, today.month):
            raise ValueError("Date of birth is in the future")
        age = age_on(today, self.birth_year, self.birth_month)
        if age < 5:
            raise ValueError("SkillLens is for athletes aged 5 and over")
        if not self.display_name:
            raise ValueError("Please tell us what to call you")
        if not self.accept_terms:
            raise ValueError("Please accept the terms to continue")
        if self.pain_now == "none":
            self.pain_areas = []
        if age < ADULT_AGE:
            if not (self.guardian_name and self.guardian_email and self.guardian_consent):
                raise ValueError("Under 18s need a parent or guardian's name, email and agreement")
        else:
            # Adults do not need this; do not keep someone else's details for nothing.
            self.guardian_name = self.guardian_email = None
            self.guardian_consent = False
        self.pain_areas = sorted(set(self.pain_areas))
        self.past_injuries = sorted(set(self.past_injuries))
        return self


class ProfileOut(BaseModel):
    display_name: str
    birth_year: int
    birth_month: int
    gender: str
    sport_slug: str
    role: str | None
    level: str
    years_playing: str
    training_days: int
    dominant_hand: str
    dominant_foot: str
    height_cm: float
    weight_kg: float
    fitness: str
    pain_now: str
    pain_areas: list[str]
    past_injuries: list[str]
    injury_note: str | None
    goal: str
    goal_event: str | None
    goal_date: date | None
    guardian_name: str | None
    guardian_email: str | None
    terms_version: str
    terms_accepted_at: datetime
    updated_at: datetime

    # Worked out, not stored
    age: int
    is_minor: bool
    bmi: float

    model_config = {"from_attributes": True}
