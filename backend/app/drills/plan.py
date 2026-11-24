"""The weekly training plan.

Built the same way every time from two things we already hold:
  - the athlete's latest report for their main sport (what to fix, worst first)
  - their setup answers (training days, level, fitness, sore areas, old
    injuries, goal and event date)
No AI writes this; it is a set of plain rules, so the same inputs always give
the same plan and every choice can be explained.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from app.drills.library import BY_ID, Drill, as_dict, for_check, general

LEVEL_MINUTES = {"beginner": 25, "school_club": 35, "district_state": 45, "national_pro": 55}
CARE_FOR = {
    "shoulder": "gen-shoulder-care", "elbow": "gen-shoulder-care", "wrist": "gen-shoulder-care",
    "neck": "gen-shoulder-care",
    "ankle": "gen-balance", "knee": "gen-balance", "foot": "gen-balance", "shin": "gen-balance",
    "back": "gen-back-care", "hip": "gen-back-care", "groin": "gen-back-care", "hamstring": "gen-back-care",
}
OVERHEAD = {"Cricket", "Tennis", "Baseball", "Volleyball", "Badminton", "Basketball"}
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# Which of the 7 days are training days, for each number of training days.
SPREAD = {
    2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5],
}


@dataclass
class Fix:
    metric_id: str
    name: str
    status: str
    value_label: str
    target_label: str
    score: float


def _sets(base: int, level: str, fitness: str, comeback: bool) -> int:
    n = base
    if level == "beginner" or fitness == "low" or comeback:
        n -= 1
    if level == "national_pro" and fitness in ("good", "very_good") and not comeback:
        n += 1
    return max(1, n)


def build(profile, fixes: list[Fix], sport: str, *, report_date: str | None = None,
          today: date | None = None) -> dict:
    """profile: an AthleteProfile row (or anything with the same attributes)."""
    today = today or date.today()
    level, fitness, goal = profile.level, profile.fitness, profile.goal
    comeback = goal == "comeback"
    sore = set(profile.pain_areas or []) if profile.pain_now != "none" else set()
    bad_pain = profile.pain_now == "stops_me"
    notes: list[str] = []

    # How many sessions. Always at least one rest day; never zero sessions.
    asked = profile.training_days
    n = min(6, max(2, asked))
    if comeback or bad_pain:
        n = min(n, 3)
    if n != asked:
        notes.append(
            f"You said you train {asked} day{'s' if asked != 1 else ''} a week. This plan uses {n}"
            + (", to protect your body while it recovers." if (comeback or bad_pain)
               else ", because every athlete needs at least one rest day." if asked >= 7
               else ", so you keep improving between videos."))

    minutes = LEVEL_MINUTES.get(level, 35) - (10 if fitness == "low" or comeback else 0)

    if bad_pain:
        notes.insert(0, "You said pain stops you training. Please see a doctor or physiotherapist "
                        "before training hard. This plan only includes gentle work that avoids the sore area.")
    elif sore:
        notes.append("Go easy on: " + ", ".join(sorted(sore)) + ". Drills that use those areas are "
                     "marked. Stop any drill that makes the pain worse.")

    if profile.goal_event and profile.goal_date:
        days_left = (profile.goal_date - today).days
        if days_left >= 0:
            notes.append(f"{days_left} day{'s' if days_left != 1 else ''} to {profile.goal_event}.")

    def usable(d: Drill) -> bool:
        return not (bad_pain and sore & set(d.loads))

    def item(d: Drill, why: str | None = None) -> dict:
        out = {**as_dict(d), "sets": _sets(d.sets, level, fitness, comeback), "why": why}
        hit = sorted(sore & set(d.loads))
        out["caution"] = f"This uses your {', '.join(hit)}. Go gently and stop if it hurts." if hit else None
        return out

    # The technique drills, worst fix first, one or two drills each, no repeats.
    technique: list[dict] = []
    seen: set[str] = set()
    for f in fixes[:4]:
        for d in for_check(f.metric_id, f.status, limit=2):
            if d.id in seen or not usable(d):
                continue
            seen.add(d.id)
            arrow = "more" if f.status == "low" else "less"
            technique.append(item(d, f"Fixes: {f.name} (you: {f.value_label}, target {f.target_label}, needs {arrow})"))

    if not fixes:
        notes.append("Analyse a video of your main sport and this plan will target your own mistakes. "
                     "Until then it builds general strength and movement.")

    # Body care: old injuries and sore areas get their care drill; overhead sports get shoulder care.
    care_ids: list[str] = []
    for area in sorted(set(profile.past_injuries or []) | sore):
        cid = CARE_FOR.get(area)
        if cid and cid not in care_ids:
            care_ids.append(cid)
    if sport in OVERHEAD and "gen-shoulder-care" not in care_ids:
        care_ids.append("gen-shoulder-care")
    if goal == "prevent_injury" and "gen-balance" not in care_ids:
        care_ids.append("gen-balance")
    care = [item(BY_ID[c], "Looks after your body") for c in care_ids]

    warmup = item(BY_ID["gen-warmup"], "Every session starts here")
    mobility = item(BY_ID["gen-mobility"], "Recovery")
    strength = [item(d, "Strength for your sport") for d in general("strength") if usable(d)]
    if goal == "fitness" and usable(BY_ID["gen-easy-cardio"]):
        strength.append(item(BY_ID["gen-easy-cardio"], "Stamina, because you want to get fitter"))

    # Lay out the week.
    training_slots = SPREAD[n]
    sessions: list[dict] = []
    tech_rounds = [technique[i::2] for i in range(2)] if len(technique) > 2 else [technique, technique]
    kinds = []
    for i in range(n):
        if i == n - 1:
            kinds.append("film")
        elif i % 2 == 1 and n > 2:
            kinds.append("strength")
        else:
            kinds.append("technique")

    t_round = 0
    for kind in kinds:
        if kind == "technique":
            items = [warmup] + (tech_rounds[t_round % 2] or strength[:1]) + care[:1]
            t_round += 1
            title = "Technique" if technique else "Movement and strength"
        elif kind == "strength":
            items = [warmup] + strength[:2] + care + [mobility]
            title = "Strength and body care"
        else:
            items = [warmup] + technique[:2] + [{
                "id": "film-again", "name": "Film your next video", "sport": sport,
                "purpose": "See what changed this week.",
                "steps": ["Follow the filming guide for your sport.",
                          "Record a new video and analyse it.",
                          "Your next plan will be built from the new report."],
                "sets": 1, "reps": "1 video", "equipment": "Your phone", "minutes": 5, "loads": [],
                "safety": None, "verified": True, "why": "Shows your progress", "caution": None}]
            title = "Practise, then film again"
        sessions.append({"kind": kind, "title": title, "items": items})

    days = []
    s_iter = iter(sessions)
    for i in range(7):
        d = today + timedelta(days=i)
        base = {"date": d.isoformat(), "weekday": WEEKDAYS[d.weekday()], "minutes": 0}
        if i in training_slots:
            s = next(s_iter)
            total = sum(x["minutes"] for x in s["items"])
            days.append({**base, "kind": s["kind"], "title": s["title"],
                         "minutes": max(total, minutes) if s["kind"] != "film" else total,
                         "items": s["items"]})
        else:
            days.append({**base, "kind": "rest", "title": "Rest day",
                         "items": [], "note": "Rest helps your body get stronger. A walk or light stretching is fine."})

    return {
        "sport": sport,
        "based_on_report": report_date,
        "sessions_per_week": n,
        "notes": notes,
        "days": days,
        "unverified": True,
    }
