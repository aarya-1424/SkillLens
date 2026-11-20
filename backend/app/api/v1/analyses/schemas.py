from datetime import datetime

from pydantic import BaseModel, Field


class MetricResultIn(BaseModel):
    id: str
    name: str
    group: str
    layer: int
    unit: str
    value: float
    value_label: str
    target_label: str
    score: float
    severity: str
    status: str
    direction: str
    amount: str = ""
    headline: str = ""
    cue: str = ""


class SaveAnalysisRequest(BaseModel):
    movement_slug: str
    sport: str
    movement_name: str
    total: float
    grade: str
    injury_risk: str
    confidence: float = 0.0
    measured: int = 0
    skipped: int = 0
    groups: dict[str, float] = Field(default_factory=dict)
    scoring_version: str
    unverified: bool = True
    results: list[MetricResultIn]


class AnalysisSummary(BaseModel):
    id: str
    movement_slug: str
    sport: str
    movement_name: str
    total: float
    grade: str
    injury_risk: str
    confidence: float
    measured: int
    created_at: datetime


class MetricResultOut(MetricResultIn):
    pass


class AnalysisDetail(AnalysisSummary):
    groups: dict[str, float]
    scoring_version: str
    unverified: bool
    skipped: int
    ai_summary: str | None = None
    results: list[MetricResultOut]


class ProgressPoint(BaseModel):
    date: datetime
    total: float
    injury_risk: str
    analysis_id: str


class StatsOut(BaseModel):
    count: int
    best: float | None = None
    latest_total: float | None = None
    latest_grade: str | None = None
    latest_sport: str | None = None
    latest_movement: str | None = None
    latest_id: str | None = None
    change_since_last: float | None = None
