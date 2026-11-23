"""Saved reports, so a player's progress is real history and not a sample chart.

A report is stored FLAT — every metric result is written out with the words
that were shown at the time. If we later improve a target band or reword a
cue, old reports still read exactly as the player first saw them.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, false, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    """Set in Python, not by the database.

    SQLite's CURRENT_TIMESTAMP only resolves to the second, so two reports
    saved in the same second tied and "latest" came back as the older one.
    """
    return datetime.now(timezone.utc)


class Profile(Base):
    """One row per signed-in person. The id is their Supabase user id."""

    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(320))
    name: Mapped[str | None] = mapped_column(String(200))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # Privacy controls (see the Privacy Policy, sections 7 and 8).
    # AI paused: nothing about this person is sent to an outside AI model.
    ai_paused: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    # Account deletion: asked for at `deletion_requested_at`, carried out on
    # `deletion_due_at` unless they cancel first (a 30-day change-of-mind window).
    deletion_requested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deletion_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    analyses: Mapped[list["Analysis"]] = relationship(back_populates="profile")
    athlete: Mapped["AthleteProfile | None"] = relationship(
        back_populates="profile", uselist=False, cascade="all, delete-orphan")


class AthleteProfile(Base):
    """The answers to the setup questionnaire. One row per person.

    Kept apart from `profiles` (which mirrors the Google account) because
    these are the athlete's own answers, change over time, and include
    health details that deserve their own clearly named home.
    """

    __tablename__ = "athlete_profiles"

    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("profiles.id"), primary_key=True)

    # About you
    display_name: Mapped[str] = mapped_column(String(60))
    birth_year: Mapped[int] = mapped_column(Integer)
    birth_month: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(16))

    # Your sport
    sport_slug: Mapped[str] = mapped_column(String(64))
    role: Mapped[str | None] = mapped_column(String(60))
    level: Mapped[str] = mapped_column(String(24))
    years_playing: Mapped[str] = mapped_column(String(16))
    training_days: Mapped[int] = mapped_column(Integer)
    dominant_hand: Mapped[str] = mapped_column(String(8))
    dominant_foot: Mapped[str] = mapped_column(String(8))

    # Your body
    height_cm: Mapped[float] = mapped_column(Float)
    weight_kg: Mapped[float] = mapped_column(Float)
    fitness: Mapped[str] = mapped_column(String(16))
    pain_now: Mapped[str] = mapped_column(String(16))
    pain_areas: Mapped[list] = mapped_column(JSON, default=list)
    past_injuries: Mapped[list] = mapped_column(JSON, default=list)
    injury_note: Mapped[str | None] = mapped_column(String(300))

    # Your goal
    goal: Mapped[str] = mapped_column(String(24))
    goal_event: Mapped[str | None] = mapped_column(String(80))
    goal_date: Mapped[datetime | None] = mapped_column(Date)

    # Consent
    terms_version: Mapped[str] = mapped_column(String(16))
    terms_accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    guardian_name: Mapped[str | None] = mapped_column(String(120))
    guardian_email: Mapped[str | None] = mapped_column(String(320))
    guardian_consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    profile: Mapped[Profile] = relationship(back_populates="athlete")


class Analysis(Base):
    """One saved report."""

    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("profiles.id"), index=True)

    movement_slug: Mapped[str] = mapped_column(String(64), index=True)
    sport: Mapped[str] = mapped_column(String(64))
    movement_name: Mapped[str] = mapped_column(String(120))

    total: Mapped[float] = mapped_column(Float)
    grade: Mapped[str] = mapped_column(String(32))
    injury_risk: Mapped[str] = mapped_column(String(16))
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    measured: Mapped[int] = mapped_column(Integer, default=0)
    skipped: Mapped[int] = mapped_column(Integer, default=0)
    groups: Mapped[dict] = mapped_column(JSON, default=dict)

    scoring_version: Mapped[str] = mapped_column(String(32))
    unverified: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_summary: Mapped[str | None] = mapped_column(Text)
    # When the clip held several repetitions: each one's score. The report itself is the typical one.
    reps: Mapped[list | None] = mapped_column(JSON)
    # Made by the demo "sample data" button, not from a real video. Shown as "Sample".
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True)

    profile: Mapped[Profile] = relationship(back_populates="analyses")
    metrics: Mapped[list["AnalysisMetric"]] = relationship(
        back_populates="analysis", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_analyses_user_movement_time", "user_id", "movement_slug", "created_at"),)


class AnalysisMetric(Base):
    """One measured check inside a saved report, with the words shown at the time."""

    __tablename__ = "analysis_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="CASCADE"), index=True)

    metric_id: Mapped[str] = mapped_column(String(96), index=True)
    name: Mapped[str] = mapped_column(String(160))
    group: Mapped[str] = mapped_column(String(32))
    layer: Mapped[int] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String(16))

    value: Mapped[float] = mapped_column(Float)
    value_label: Mapped[str] = mapped_column(String(32))
    target_label: Mapped[str] = mapped_column(String(48))
    score: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(8))
    direction: Mapped[str] = mapped_column(String(16))
    amount: Mapped[str] = mapped_column(String(32), default="")
    headline: Mapped[str] = mapped_column(Text, default="")
    cue: Mapped[str] = mapped_column(Text, default="")

    analysis: Mapped[Analysis] = relationship(back_populates="metrics")


class ChatMessage(Base):
    """Ask Coach, kept so a player can look back at what they were told."""

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    analysis_id: Mapped[str | None] = mapped_column(String(36), index=True)
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    from_cache: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class AiCache(Base):
    """Every AI answer, reused when the same question comes round again.

    Keyed on a fingerprint of the question AND the library version, so edits
    to the library retire the old answers instead of serving stale advice.
    """

    __tablename__ = "ai_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    prompt_type: Mapped[str] = mapped_column(String(32))
    response: Mapped[str] = mapped_column(Text)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    model: Mapped[str] = mapped_column(String(120), default="")
    library_version: Mapped[str] = mapped_column(String(32), default="")
    hit_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class PrivacyRequest(Base):
    """A record of every privacy right used, every consent given, and every complaint.

    This is our proof that we did what the Privacy Policy promises: when
    someone downloaded their data, paused AI, asked for deletion, or raised a
    complaint, and when we must answer by. After an account is erased, the
    rows stay but `user_id` is replaced by a one-way fingerprint and any free
    text is removed, so the record no longer identifies anyone.
    """

    __tablename__ = "privacy_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(80), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    # open -> resolved for things a person must answer (complaints, requests);
    # done for things the app carries out straight away.
    status: Mapped[str] = mapped_column(String(16), default="done")
    details: Mapped[str | None] = mapped_column(Text)
    policy_version: Mapped[str | None] = mapped_column(String(16))
    due_by: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
