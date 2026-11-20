"""Saved reports, so a player's progress is real history and not a sample chart.

A report is stored FLAT — every metric result is written out with the words
that were shown at the time. If we later improve a target band or reword a
cue, old reports still read exactly as the player first saw them.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, func,
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

    analyses: Mapped[list["Analysis"]] = relationship(back_populates="profile")


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
