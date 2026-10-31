from pydantic import BaseModel, Field

from app.movements.models import Metric, Movement
from app.scoring.engine import MetricResult, MovementResult

LAYER_NAMES = {
    1: "Joint angles", 2: "Body position", 3: "Distances",
    4: "Left/right balance", 5: "Timing & order", 6: "Speed & power",
}


class MetricOut(BaseModel):
    id: str
    layer: int
    layer_name: str
    group: str
    name: str
    means: str
    unit: str
    moment: str
    target_min: float
    target_max: float
    weight: float
    verified: bool
    source: str

    @classmethod
    def of(cls, m: Metric) -> "MetricOut":
        return cls(
            id=m.id, layer=int(m.layer), layer_name=LAYER_NAMES[int(m.layer)], group=m.group,
            name=m.name, means=m.means, unit=m.unit.value, moment=m.moment,
            target_min=m.ideal_min, target_max=m.ideal_max, weight=m.weight,
            verified=m.verified, source=m.source,
        )


class MovementSummary(BaseModel):
    slug: str
    sport: str
    icon: str
    name: str
    camera: str
    tips: list[str]
    metric_count: int
    layers: dict[str, int]
    beta: bool

    @classmethod
    def of(cls, mv: Movement) -> "MovementSummary":
        layers: dict[str, int] = {}
        for m in mv.metrics:
            layers[LAYER_NAMES[int(m.layer)]] = layers.get(LAYER_NAMES[int(m.layer)], 0) + 1
        return cls(
            slug=mv.slug, sport=mv.sport, icon=mv.sport_icon, name=mv.name, camera=mv.camera,
            tips=list(mv.tips), metric_count=len(mv.metrics), layers=layers, beta=mv.beta,
        )


class MovementDetail(MovementSummary):
    metrics: list[MetricOut]

    @classmethod
    def of(cls, mv: Movement) -> "MovementDetail":  # type: ignore[override]
        base = MovementSummary.of(mv)
        return cls(**base.model_dump(), metrics=[MetricOut.of(m) for m in mv.metrics])


class GaugeOut(BaseModel):
    scale_min: float
    scale_max: float
    zone_min: float
    zone_max: float
    value: float


class MetricResultOut(BaseModel):
    id: str
    name: str
    means: str
    group: str
    layer: int
    layer_name: str
    unit: str
    value: float
    value_label: str
    target_label: str
    score: float
    severity: str
    status: str
    direction: str
    amount: str
    size: str
    headline: str
    cue: str
    gauge: GaugeOut

    @classmethod
    def of(cls, r: MetricResult) -> "MetricResultOut":
        from app.scoring.engine import fmt

        m, g = r.metric, r.guidance
        return cls(
            id=m.id, name=m.name, means=m.means, group=m.group, layer=int(m.layer),
            layer_name=LAYER_NAMES[int(m.layer)], unit=m.unit.value,
            value=r.value, value_label=fmt(m.unit, r.value),
            target_label=f"{fmt(m.unit, m.ideal_min)} – {fmt(m.unit, m.ideal_max)}",
            score=r.score, severity=r.severity, status=g.status, direction=g.direction,
            amount=g.amount, size=g.size, headline=g.headline, cue=g.cue,
            gauge=GaugeOut(**g.gauge.__dict__),
        )


class ScoreRequest(BaseModel):
    values: dict[str, float] = Field(..., description="metric id -> measured value")


class ScoreResponse(BaseModel):
    movement: str
    total: float
    grade: str
    injury_risk: str
    groups: dict[str, float]
    measured: int
    skipped: list[str]
    unverified: bool
    scoring_version: str
    fixes: list[MetricResultOut]
    strengths: list[MetricResultOut]
    all_results: list[MetricResultOut]

    @classmethod
    def of(cls, r: MovementResult) -> "ScoreResponse":
        return cls(
            movement=r.movement.slug, total=r.total, grade=r.grade, injury_risk=r.injury_risk,
            groups=r.groups, measured=r.measured, skipped=r.skipped, unverified=r.unverified,
            scoring_version=r.scoring_version,
            fixes=[MetricResultOut.of(x) for x in r.fixes],
            strengths=[MetricResultOut.of(x) for x in r.strengths],
            all_results=[MetricResultOut.of(x) for x in r.results],
        )
