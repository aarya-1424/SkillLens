import httpx
import pytest

from app.ai import llm
from app.core.config import settings


class FakeResponse:
    def __init__(self, status, body=None, headers=None):
        self.status_code = status
        self._body = body or {}
        self.headers = headers or {}

    def json(self):
        return self._body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("err", request=None, response=None)


def answer(text, model="m"):
    return FakeResponse(200, {"model": model, "choices": [{"message": {"content": text}}]})


@pytest.fixture
def two_providers(monkeypatch):
    monkeypatch.setattr(settings, "LLM_BASE_URL", "http://gateway/v1")
    monkeypatch.setattr(settings, "LLM_API_KEY", "k")
    monkeypatch.setattr(settings, "LLM_FALLBACKS", '[{"base_url": "http://backup/v1", "model": "llama"}]')


def test_uses_primary_when_it_works(two_providers, monkeypatch):
    calls = []
    monkeypatch.setattr(llm, "_post", lambda p, path, body: calls.append(p.base_url) or answer("hi", "groq/llama"))
    result = llm.chat([{"role": "user", "content": "x"}])
    assert result.text == "hi"
    assert calls == ["http://gateway/v1"]


def test_falls_back_when_primary_is_rate_limited(two_providers, monkeypatch):
    replies = {"http://gateway/v1": FakeResponse(429), "http://backup/v1": answer("from backup")}
    monkeypatch.setattr(llm, "_post", lambda p, path, body: replies[p.base_url])
    assert llm.chat([{"role": "user", "content": "x"}]).text == "from backup"


def test_falls_back_when_primary_is_unreachable(two_providers, monkeypatch):
    def post(p, path, body):
        if p.base_url == "http://gateway/v1":
            raise httpx.ConnectError("down")
        return answer("ok")

    monkeypatch.setattr(llm, "_post", post)
    assert llm.chat([{"role": "user", "content": "x"}]).text == "ok"


def test_raises_when_everything_fails(two_providers, monkeypatch):
    monkeypatch.setattr(llm, "_post", lambda p, path, body: FakeResponse(503))
    with pytest.raises(llm.LLMUnavailable):
        llm.chat([{"role": "user", "content": "x"}])


def test_raises_when_nothing_configured(monkeypatch):
    monkeypatch.setattr(settings, "LLM_BASE_URL", None)
    monkeypatch.setattr(settings, "LLM_FALLBACKS", "[]")
    with pytest.raises(llm.LLMUnavailable):
        llm.chat([{"role": "user", "content": "x"}])


def test_embed_keeps_input_order(two_providers, monkeypatch):
    body = {"data": [{"index": 1, "embedding": [2.0]}, {"index": 0, "embedding": [1.0]}]}
    monkeypatch.setattr(llm, "_post", lambda p, path, b: FakeResponse(200, body))
    assert llm.embed(["a", "b"]) == [[1.0], [2.0]]
