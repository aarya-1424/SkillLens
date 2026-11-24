"""Plateau and slipping alerts: plain rules over a player's own saved reports.

For each movement with at least three reports, look at the last three:
  - slipping:  the latest score is 5+ points below the best of the two before
  - plateau:   the three scores sit within 3 points of each other, and the
               latest is still under 85 (at 85+ holding steady is fine)
  - improving: each of the three is higher than the one before
For a plateau or a slip we name the check that is holding things back (the
lowest-scoring check that has not improved over those three reports) and
suggest the drills for it. No AI; the same reports always give the same alert.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.drills.library import as_dict, for_check
from app.history.models import Analysis
from app.movements import library

WINDOW = 3
PLATEAU_SPREAD = 3.0
SLIP = 5.0
GOOD_ENOUGH = 85.0


def _stuck_check(reports: list[Analysis]) -> dict | None:
    """The weakest check in the latest report that did not get better across the window."""
    first = {m.metric_id: m for m in reports[0].metrics}
    latest = sorted(reports[-1].metrics, key=lambda m: m.score)
    for m in latest:
        if m.status == "good":
            continue
        before = first.get(m.metric_id)
        if before is None or m.score <= before.score + 1:
            return {"metric_id": m.metric_id, "name": m.name, "value_label": m.value_label,
                    "target_label": m.target_label, "score": m.score,
                    "drills": [as_dict(d) for d in for_check(m.metric_id, m.status, limit=2)]}
    return None


def for_user(db: Session, user_id: str) -> list[dict]:
    rows = db.execute(select(Analysis).where(Analysis.user_id == user_id)
                      .options(selectinload(Analysis.metrics))
                      .order_by(Analysis.created_at)).scalars().all()
    by_movement: dict[str, list[Analysis]] = {}
    for a in rows:
        by_movement.setdefault(a.movement_slug, []).append(a)

    out = []
    for slug, reports in by_movement.items():
        if len(reports) < WINDOW:
            continue
        last = reports[-WINDOW:]
        totals = [r.total for r in last]
        movement = library.get(slug)
        name = movement.name if movement else slug
        base = {"movement_slug": slug, "movement": name, "sport": movement.sport if movement else "",
                "scores": [round(t, 1) for t in totals], "latest_report_id": last[-1].id}

        if totals[-1] <= max(totals[:-1]) - SLIP:
            stuck = _stuck_check(last)
            out.append({**base, "kind": "slipping", "stuck": stuck,
                        "message": f"Your {name.lower()} score has dropped to {totals[-1]:.0f} from {max(totals[:-1]):.0f}. "
                                   "This can happen when you are tired, have a small pain, or film from a different angle. "
                                   + (f"The check that dropped most is: {stuck['name']}." if stuck else "")})
        elif max(totals) - min(totals) <= PLATEAU_SPREAD and totals[-1] < GOOD_ENOUGH:
            stuck = _stuck_check(last)
            out.append({**base, "kind": "plateau", "stuck": stuck,
                        "message": f"Your {name.lower()} has stayed around {totals[-1]:.0f} for your last {WINDOW} videos. "
                                   + (f"The main thing to fix is: {stuck['name']} "
                                      f"(you: {stuck['value_label']}, target {stuck['target_label']}). "
                                      "Work on one thing at a time, then film again."
                                      if stuck else "Try changing one thing at a time, then film again.")})
        elif totals[0] < totals[1] < totals[2]:
            out.append({**base, "kind": "improving", "stuck": None,
                        "message": f"Your {name.lower()} has improved in each of your last {WINDOW} videos. Keep going."})
    order = {"slipping": 0, "plateau": 1, "improving": 2}
    return sorted(out, key=lambda x: order[x["kind"]])
