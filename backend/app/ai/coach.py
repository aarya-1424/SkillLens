"""The two places SkillLens lets an AI write words.

Rules that do not bend:
  - The AI never decides a score. It explains numbers our engine produced.
  - Ask Coach answers from our own library passages, and says so when the
    library has nothing. No confident invented advice.
  - Every answer is cached, so the same question costs nothing twice.
  - If every model provider is down, the app carries on without the words.
"""
from __future__ import annotations

import hashlib
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai import knowledge, llm
from app.history.models import AiCache

SUMMARY_SYSTEM = (
    "You are a friendly sports coach writing to a young athlete in plain English. "
    "Three or four short sentences, no jargon, no bullet points, no emoji. "
    "Say what went well first, then the single most important thing to fix and why "
    "it matters for their body or their performance. Use only the numbers given. "
    "Never invent measurements. Do not give medical advice."
)

COACH_SYSTEM = (
    "You are SkillLens's coaching assistant, talking to a young athlete in plain English. "
    "Answer ONLY from the library passages provided. If they do not cover the question, "
    "say plainly that SkillLens's library does not cover it yet and suggest they ask a "
    "qualified coach — do not fall back on your own sports knowledge. "
    "Keep it under 120 words. No medical advice, no diagnosis. "
    "Never claim a measurement the passages do not contain."
)

NO_AI_MESSAGE = "The coaching assistant is unavailable right now. Your scores and drills are unaffected."


def _fingerprint(kind: str, parts: list[str]) -> str:
    raw = kind + "|" + knowledge.library_version() + "|" + "|".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def _from_cache(db: Session, key: str) -> AiCache | None:
    row = db.execute(select(AiCache).where(AiCache.question_hash == key)).scalars().first()
    if row:
        row.hit_count += 1
        db.commit()
    return row


def _to_cache(db: Session, key: str, kind: str, text: str, model: str, sources: list[dict]) -> None:
    db.add(AiCache(question_hash=key, prompt_type=kind, response=text, model=model,
                   sources=sources, library_version=knowledge.library_version(), hit_count=0))
    db.commit()


def summarise(db: Session, analysis) -> tuple[str | None, bool]:
    """A few friendly sentences about one report. Returns (text, from_cache)."""
    worst = sorted(analysis.metrics, key=lambda m: m.score)[:2]
    best = sorted(analysis.metrics, key=lambda m: -m.score)[:2]

    # Round the scores for the fingerprint so near-identical reports share an answer.
    key = _fingerprint("summary", [
        analysis.movement_slug, str(int(analysis.total // 5)), analysis.injury_risk,
        *[f"{m.metric_id}:{int(m.score // 10)}" for m in worst],
    ])
    cached = _from_cache(db, key)
    if cached:
        return cached.response, True

    facts = {
        "sport": analysis.sport,
        "movement": analysis.movement_name,
        "score_out_of_100": analysis.total,
        "grade": analysis.grade,
        "injury_risk": analysis.injury_risk,
        "doing_well": [{"check": m.name, "value": m.value_label} for m in best],
        "needs_work": [
            {"check": m.name, "value": m.value_label, "target": m.target_label,
             "fix": m.headline, "coach_note": m.cue}
            for m in worst
        ],
    }

    try:
        result = llm.chat(
            [{"role": "system", "content": SUMMARY_SYSTEM},
             {"role": "user", "content": json.dumps(facts, ensure_ascii=False)}],
            temperature=0.4, max_tokens=260,
        )
    except llm.LLMUnavailable:
        return None, False

    _to_cache(db, key, "summary", result.text, result.model, [])
    return result.text, False


def ask(db: Session, question: str, *, sport: str | None = None,
        movement: str | None = None, report_facts: dict | None = None) -> dict:
    """Ask Coach. Returns {answer, sources, from_cache, grounded}."""
    question = question.strip()
    passages = knowledge.search(question, sport=sport, movement=movement)
    sources = [p.cite() for p in passages]

    key = _fingerprint("ask", [question.lower(), sport or "", movement or "",
                               json.dumps(report_facts, sort_keys=True) if report_facts else ""])
    cached = _from_cache(db, key)
    if cached:
        return {"answer": cached.response, "sources": cached.sources,
                "from_cache": True, "grounded": bool(cached.sources)}

    if not passages:
        answer = (
            "SkillLens's library does not cover that one yet, so I would rather not guess. "
            "Ask a qualified coach, and try me on the checks in your report — I can explain "
            "any of those in detail."
        )
        _to_cache(db, key, "ask", answer, "none", [])
        return {"answer": answer, "sources": [], "from_cache": False, "grounded": False}

    context = "\n\n".join(f"[{i + 1}] {p.title}\n{p.text}" for i, p in enumerate(passages))
    user = f"Library passages:\n{context}\n\nAthlete's question: {question}"
    if report_facts:
        user += f"\n\nTheir latest report: {json.dumps(report_facts, ensure_ascii=False)}"

    try:
        result = llm.chat(
            [{"role": "system", "content": COACH_SYSTEM}, {"role": "user", "content": user}],
            temperature=0.3, max_tokens=320,
        )
    except llm.LLMUnavailable:
        return {"answer": NO_AI_MESSAGE, "sources": sources,
                "from_cache": False, "grounded": False, "unavailable": True}

    _to_cache(db, key, "ask", result.text, result.model, sources)
    return {"answer": result.text, "sources": sources, "from_cache": False, "grounded": True}
