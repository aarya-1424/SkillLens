"""One door to every AI model we use.

Every provider is reached through the OpenAI-compatible API shape
(`POST {base_url}/chat/completions`, `POST {base_url}/embeddings`), so the
primary can be a FreeLLMAPI gateway (which rotates free providers itself),
and the backups can be Groq, Gemini, OpenRouter… directly. Swapping any of
them is a settings change, never a code change.

The AI only ever writes words (summaries, Ask Coach answers). Scores and
mistakes come from our own rules, so the app still works if every model is
down — callers should treat LLMUnavailable as "skip the AI part".
"""
import json
import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

# Worth trying the next provider on these; anything else (e.g. 400 bad request) is our bug.
_RETRYABLE_STATUS = {401, 403, 408, 409, 429, 500, 502, 503, 504}


class LLMUnavailable(Exception):
    """Every configured provider failed."""


@dataclass(frozen=True)
class Provider:
    base_url: str
    api_key: str | None
    model: str
    embedding_model: str

    @property
    def label(self) -> str:
        return f"{self.base_url} ({self.model})"


@dataclass(frozen=True)
class ChatResult:
    text: str
    model: str  # what actually answered (FreeLLMAPI reports it in X-Routed-Via)
    provider: str


def providers() -> list[Provider]:
    chain: list[Provider] = []
    if settings.LLM_BASE_URL:
        chain.append(Provider(settings.LLM_BASE_URL.rstrip("/"), settings.LLM_API_KEY, settings.LLM_MODEL, settings.LLM_EMBEDDING_MODEL))
    try:
        extra = json.loads(settings.LLM_FALLBACKS or "[]")
    except json.JSONDecodeError:
        log.error("LLM_FALLBACKS is not valid JSON; ignoring it")
        extra = []
    for p in extra:
        chain.append(Provider(p["base_url"].rstrip("/"), p.get("api_key"), p["model"], p.get("embedding_model", p["model"])))
    return chain


def _headers(p: Provider) -> dict:
    return {"Authorization": f"Bearer {p.api_key}"} if p.api_key else {}


def _post(p: Provider, path: str, body: dict) -> httpx.Response:
    with httpx.Client(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
        return client.post(f"{p.base_url}{path}", json=body, headers=_headers(p))


def chat(messages: list[dict], *, temperature: float = 0.3, max_tokens: int = 600) -> ChatResult:
    """Send a chat; on failure move down the provider list."""
    chain = providers()
    if not chain:
        raise LLMUnavailable("No AI provider configured (set LLM_BASE_URL)")
    errors = []
    for p in chain:
        try:
            res = _post(p, "/chat/completions", {"model": p.model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens})
            if res.status_code in _RETRYABLE_STATUS:
                errors.append(f"{p.label}: HTTP {res.status_code}")
                continue
            res.raise_for_status()
            data = res.json()
            text = (data["choices"][0]["message"].get("content") or "").strip()
            if not text:
                errors.append(f"{p.label}: empty answer")
                continue
            return ChatResult(text=text, model=res.headers.get("X-Routed-Via") or data.get("model") or p.model, provider=p.base_url)
        except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
            errors.append(f"{p.label}: {exc.__class__.__name__}")
    log.warning("All AI providers failed: %s", "; ".join(errors))
    raise LLMUnavailable("; ".join(errors))


def embed(texts: list[str]) -> list[list[float]]:
    """Turn texts into meaning vectors for the Ask Coach library search.

    Vectors from different models are not comparable, so every provider in
    the chain must be configured with the same embedding model.
    """
    chain = providers()
    if not chain:
        raise LLMUnavailable("No AI provider configured (set LLM_BASE_URL)")
    errors = []
    for p in chain:
        try:
            res = _post(p, "/embeddings", {"model": p.embedding_model, "input": texts})
            if res.status_code in _RETRYABLE_STATUS:
                errors.append(f"{p.label}: HTTP {res.status_code}")
                continue
            res.raise_for_status()
            rows = sorted(res.json()["data"], key=lambda r: r["index"])
            return [r["embedding"] for r in rows]
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            errors.append(f"{p.label}: {exc.__class__.__name__}")
    raise LLMUnavailable("; ".join(errors))
