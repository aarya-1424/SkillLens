"""Finding the right pages of our own library before the AI writes anything.

This is the "R" in RAG. We do NOT let the model answer sports questions from
its own memory — it gets the relevant entries out of our checked library and
is told to answer from those alone. That is what makes two players asking the
same question get the same answer, and what lets every answer show its source.

Retrieval is plain word-overlap scoring over the library. It is small, fast,
needs no embedding service, and is easy to reason about. Meaning-based search
over a bigger written library is the upgrade once that library exists.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.movements import library

_STOP = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'my', 'me',
    'i', 'you', 'your', 'it', 'its', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'but',
    'if', 'so', 'that', 'this', 'with', 'how', 'what', 'why', 'when', 'can', 'should', 'would',
    'about', 'from', 'get', 'got', 'have', 'has', 'am', 'im', 'does', 'doing', 'keep', 'help',
}


def _words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]+", text.lower()) if len(w) > 2 and w not in _STOP}


@dataclass(frozen=True)
class Passage:
    """One entry from the library, ready to hand to the model."""

    source_id: str
    title: str
    sport: str
    text: str
    verified: bool

    def cite(self) -> dict:
        return {"id": self.source_id, "title": self.title,
                "sport": self.sport, "verified": self.verified}


def _passages() -> list[Passage]:
    out: list[Passage] = []
    for mv in library.all_movements():
        for m in mv.metrics:
            body = " ".join(filter(None, [
                f"{mv.sport} {mv.name}.", m.name + ".", m.means,
                f"The target range is {m.ideal_min} to {m.ideal_max} {m.unit.value}.",
                m.cue_low, m.cue_high, m.cue_good,
            ]))
            out.append(Passage(
                source_id=m.id, title=f"{mv.sport} · {m.name}", sport=mv.sport,
                text=body, verified=m.verified,
            ))
    return out


_CACHE: list[Passage] | None = None
_WORDS: list[set[str]] | None = None
_COMMON: set[str] | None = None

# A word in more than this share of passages carries no meaning here ("knee"
# is useful, "your" is not). Without this, one filler word in common was
# enough to "ground" an answer about protein powder in a badminton passage.
_TOO_COMMON = 0.30


def all_passages() -> list[Passage]:
    global _CACHE, _WORDS, _COMMON
    if _CACHE is None:
        _CACHE = _passages()
        _WORDS = [_words(p.title + " " + p.text) for p in _CACHE]
        counts: dict[str, int] = {}
        for bag in _WORDS:
            for w in bag:
                counts[w] = counts.get(w, 0) + 1
        ceiling = max(1, int(len(_CACHE) * _TOO_COMMON))
        _COMMON = {w for w, n in counts.items() if n > ceiling}
    return _CACHE


def search(question: str, *, sport: str | None = None, movement: str | None = None,
           limit: int = 5) -> list[Passage]:
    """The library entries most likely to answer this question.

    A match only counts when the shared words actually mean something. A
    question that shares nothing but filler returns nothing, and the caller
    then tells the player we do not cover it rather than inventing an answer.
    """
    wanted = _words(question)
    passages = all_passages()
    if not wanted:
        return []

    scored: list[tuple[float, Passage]] = []
    for p, bag in zip(passages, _WORDS):
        overlap = wanted & bag
        meaningful = overlap - _COMMON
        if not meaningful:
            continue
        # Meaningful words carry the weight; filler adds only a tiny nudge.
        score = len(meaningful) * 2 + len(overlap - meaningful) * 0.25
        # Nudge towards the sport or movement the player is actually asking about.
        if movement and p.source_id.startswith(movement + "."):
            score += 4
        elif sport and p.sport.lower() == sport.lower():
            score += 2
        scored.append((score, p))

    scored.sort(key=lambda row: (-row[0], row[1].source_id))
    return [p for _, p in scored[:limit]]


def library_version() -> str:
    """Changes whenever the library changes, so cached answers retire."""
    return f"{len(all_passages())}-{library.metric_count()}"
