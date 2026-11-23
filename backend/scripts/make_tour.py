"""Build the data for "Take the tour": a complete example account, no sign-in.

Everything is produced by the REAL backend (scoring engine, drill library,
weekly plan, alerts, teams) against a throwaway database, then saved as one
file the website can show to visitors: frontend/public/tour/tour.json.
Nothing touches the live database.

Run from the backend folder:   python scripts/make_tour.py
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from datetime import date, datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
OUT = os.path.join(os.path.dirname(BACKEND), "frontend", "public", "tour", "tour.json")
sys.path.insert(0, BACKEND)
tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(tmp, "tour.db").replace("\\", "/")
os.environ["LLM_BASE_URL"] = ""          # no outside AI calls
for k in ("RESEND_API_KEY", "SMTP_HOST", "EMAIL_FROM"):
    os.environ.pop(k, None)

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.api.deps import get_current_user  # noqa: E402
from app.core.auth import CurrentUser  # noqa: E402
from app.db.session import Base, get_engine  # noqa: E402
from app.demo.seed import SESSIONS, _payload  # noqa: E402
from app.history import models  # noqa: E402,F401
from app.history import service as history  # noqa: E402
from app.main import app  # noqa: E402

Base.metadata.create_all(get_engine())
NOW = datetime.now(timezone.utc)
TODAY = date.today()


def user(uid, name):
    return CurrentUser(id=uid, email=f"{uid}@example.invalid", name=name, avatar_url=None)


ATHLETE = user("tour-athlete", "Aarav")
COACH_OTHER = user("tour-coach", "Coach Priya")
PLAYERS = {
    "meera": user("tour-meera", "Meera"),
    "rohan": user("tour-rohan", "Rohan"),
    "kabir": user("tour-kabir", "Kabir"),
    "ananya": user("tour-ananya", "Ananya"),
}
current = {"u": ATHLETE}
app.dependency_overrides[get_current_user] = lambda: current["u"]
client = TestClient(app)


def as_(u):
    current["u"] = u
    return client


def profile(name, year, level, goal, *, pain="none", areas=(), event=None, days_to_event=None,
            role="Singles", training=4, injuries=()):
    return {
        "display_name": name, "birth_year": year, "birth_month": 4, "gender": "prefer_not",
        "sport_slug": "badminton-smash", "role": role, "level": level, "years_playing": "3_5",
        "training_days": training, "dominant_hand": "right", "dominant_foot": "right",
        "height_cm": 171, "weight_kg": 63, "fitness": "good", "pain_now": pain, "pain_areas": list(areas),
        "past_injuries": list(injuries), "injury_note": None, "goal": goal, "goal_event": event,
        "goal_date": (TODAY + timedelta(days=days_to_event)).isoformat() if days_to_event else None,
        "accept_terms": True,
    }


def save(u, slug, days_ago, values, i=0):
    with Session(get_engine()) as db:
        a = history.save_analysis(db, u, _payload(slug, values, 0.86 + 0.01 * (i % 8)))
        a.is_sample = True
        a.created_at = NOW - timedelta(days=days_ago, hours=2 * i)
        db.commit()
        return a.id


def shifted(base, **delta):
    return {k: v + delta.get(k, 0) for k, v in base.items()}


SMASH = SESSIONS["badminton-smash"]
SQUAT = SESSIONS["gym-squat"]

# ── the tour athlete: six weeks of badminton, two squat sessions ──
as_(ATHLETE).put("/api/v1/me/profile", json=profile(
    "Aarav", TODAY.year - 21, "district_state", "selection", event="State badminton trials",
    days_to_event=45, injuries=["ankle"])).raise_for_status()
for i, (d, v) in enumerate(SMASH):
    save(ATHLETE, "badminton-smash", d, v, i)
for i, (d, v) in enumerate(SQUAT):
    save(ATHLETE, "gym-squat", d, v, i)

# ── four squad players, each telling a different story ──
for key, (name, year, level, pain, areas) in {
    "meera": ("Meera", TODAY.year - 19, "district_state", "none", ()),
    "rohan": ("Rohan", TODAY.year - 22, "school_club", "none", ()),
    "kabir": ("Kabir", TODAY.year - 20, "district_state", "stops_me", ("shoulder",)),
    "ananya": ("Ananya", TODAY.year - 24, "beginner", "none", ()),
}.items():
    as_(PLAYERS[key]).put("/api/v1/me/profile", json=profile(
        name, year, level, "technique", pain=pain, areas=areas)).raise_for_status()

best = SMASH[-1][1]
for i, (d, delta) in enumerate([(30, {}), (16, {"elbow_cock": -3, "extension": 2, "hip_shoulder": 3}),
                                (4, {"elbow_cock": -5, "extension": 3, "hip_shoulder": 4, "arm_speed": 30})]):
    save(PLAYERS["meera"], "badminton-smash", d, shifted(best, **delta), i)          # improving, high
mid = SMASH[2][1]
for i, d in enumerate((25, 14, 5)):
    save(PLAYERS["rohan"], "badminton-smash", d, shifted(mid, elbow_cock=i % 2, extension=-(i % 2)), i)  # stuck
for i, (d, delta) in enumerate([(28, {"elbow_cock": -6, "extension": 3}), (15, {"elbow_cock": -6, "extension": 3}),
                                (3, {"elbow_cock": 8, "extension": -6, "arm_speed": -90, "shoulder_turn": -3})]):
    save(PLAYERS["kabir"], "badminton-smash", d, shifted(mid, **delta), i)          # slipping
save(PLAYERS["ananya"], "badminton-smash", 6, SMASH[0][1], 0)                       # just started

# ── teams: the athlete coaches a sample squad, and is in a club with drills set ──
squad = as_(ATHLETE).post("/api/v1/teams", json={"name": "Sample academy squad", "sport_slug": "badminton-smash"}).json()
for u in PLAYERS.values():
    as_(u).post("/api/v1/teams/join", json={"code": squad["invite_code"], "consent": True}).raise_for_status()
base = f"/api/v1/teams/{squad['id']}/assignments"
as_(ATHLETE).post(base, json={"drill_id": "bd-high-point", "note": "Before every session this week",
                             "due_date": (TODAY + timedelta(days=5)).isoformat()})
as_(ATHLETE).post(base, json={"drill_id": "bd-forearm-snap", "athlete_id": PLAYERS["rohan"].id,
                             "note": "Loose grip, louder whoosh"})
club = as_(COACH_OTHER).post("/api/v1/teams", json={"name": "Saturday club", "sport_slug": "badminton-smash"}).json()
as_(COACH_OTHER).put("/api/v1/me/profile", json=profile("Coach Priya", TODAY.year - 34, "national_pro", "technique"))
as_(ATHLETE).post("/api/v1/teams/join", json={"code": club["invite_code"], "consent": True}).raise_for_status()
cb = f"/api/v1/teams/{club['id']}/assignments"
as_(COACH_OTHER).post(cb, json={"drill_id": "bd-shadow-pause", "note": "10 minutes before every session",
                                "due_date": (TODAY + timedelta(days=4)).isoformat()})
as_(COACH_OTHER).post(cb, json={"drill_id": "bd-scissor-jumps", "athlete_id": ATHLETE.id, "note": "Land soft, both feet"})

# ── capture every screen's data, exactly as the API returns it ──
c = as_(ATHLETE)
get = lambda path: c.get("/api/v1" + path).json()  # noqa: E731
analyses = get("/analyses?limit=200")
movements = sorted({a["movement_slug"] for a in analyses})
squad_view = get(f"/teams/{squad['id']}")
players = {p["athlete_id"]: get(f"/teams/{squad['id']}/players/{p['athlete_id']}") for p in squad_view["players"]}
player_reports = {}
for aid, p in players.items():
    for r in p["history"]:
        player_reports[r["id"]] = get(f"/teams/{squad['id']}/players/{aid}/reports/{r['id']}")

tour = {
    "about": "Example data for the SkillLens tour, generated by the real scoring engine. Not a real person.",
    "generated_at": NOW.isoformat(),
    "profile": get("/me/profile"),
    "stats": get("/analyses/stats"),
    "analyses": analyses,
    "details": {a["id"]: get(f"/analyses/{a['id']}") for a in analyses},
    "progress": {m: get(f"/analyses/progress?movement={m}") for m in movements},
    "checks": {m: get(f"/analyses/checks?movement={m}") for m in movements},
    "insights": get("/analyses/insights"),
    "plan": get("/me/plan"),
    "teams": get("/teams/mine"),
    "squads": {squad["id"]: squad_view},
    "team_assignments": {squad["id"]: get(f"/teams/{squad['id']}/assignments")},
    "players": {f"{squad['id']}/{aid}": p for aid, p in players.items()},
    "player_reports": player_reports,
    "my_assignments": get("/me/assignments"),
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(tour, f, ensure_ascii=False, separators=(",", ":"), default=str)
print("written", OUT, f"{os.path.getsize(OUT) // 1024} KB",
      {k: (len(v) if isinstance(v, (list, dict)) else 1) for k, v in tour.items()})
print("insights:", [(i["kind"], i["movement"]) for i in tour["insights"]])
print("squad:", [(p["name"], p["latest_total"], p["injury_risk"]) for p in squad_view["players"]], squad_view["at_risk"])
