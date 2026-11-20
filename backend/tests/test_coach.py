"""Ask Coach and the AI summary.

The rule these tests defend: the model may only write words around facts that
came out of our own library and our own scoring engine. It never invents
sports advice, and the app keeps working when every provider is down.
"""
import pytest

from app.ai import coach, knowledge, llm


class FakeResult:
    def __init__(self, text):
        self.text = text
        self.model = "fake/model"
        self.provider = "fake"


@pytest.fixture
def fake_llm(monkeypatch):
    """Capture what we send the model, and reply with something predictable."""
    sent = []

    def fake_chat(messages, **kwargs):
        sent.append(messages)
        return FakeResult("Nice tall release. Work on bracing that front leg.")

    monkeypatch.setattr(llm, "chat", fake_chat)
    return sent


@pytest.fixture
def no_llm(monkeypatch):
    def down(*args, **kwargs):
        raise llm.LLMUnavailable("all providers down")

    monkeypatch.setattr(llm, "chat", down)


# ── retrieval ────────────────────────────────────────────────────────────────

def test_search_finds_the_right_library_entries():
    hits = knowledge.search("why does my front knee collapse when I bowl?")
    assert hits
    assert any("knee" in p.title.lower() for p in hits)


def test_search_prefers_the_movement_being_asked_about():
    hits = knowledge.search("how deep should my knee bend be?", movement="gym-squat")
    assert hits[0].source_id.startswith("gym-squat.")


def test_search_returns_nothing_for_an_unrelated_question():
    assert knowledge.search("what is the capital of France") == []


def test_library_version_changes_with_the_library():
    assert knowledge.library_version()


# ── ask coach ────────────────────────────────────────────────────────────────

def test_an_answer_is_grounded_and_cites_its_sources(client, fake_llm):
    res = client.post("/api/v1/coach/ask", json={
        "question": "How do I stop my front knee collapsing when I bowl?",
        "sport": "Cricket", "movement": "cricket-bowling"})
    assert res.status_code == 200
    body = res.json()
    assert body["grounded"] is True
    assert body["sources"]
    assert all("title" in s and "verified" in s for s in body["sources"])


def test_the_model_is_given_the_library_passages_to_answer_from(client, fake_llm):
    client.post("/api/v1/coach/ask", json={
        "question": "What should my front knee do at landing?",
        "movement": "cricket-bowling"})
    system, user = fake_llm[0]
    assert "ONLY from the library passages" in system["content"]
    assert "Library passages:" in user["content"]
    assert "Front knee" in user["content"]


def test_an_uncovered_question_is_refused_rather_than_guessed(client, fake_llm):
    res = client.post("/api/v1/coach/ask",
                      json={"question": "Which protein powder should I buy?"})
    body = res.json()
    assert body["grounded"] is False
    assert body["sources"] == []
    assert "does not cover" in body["answer"]
    assert not fake_llm, "the model must not be called when the library has nothing"


def test_the_same_question_is_answered_from_cache_the_second_time(client, fake_llm):
    payload = {"question": "How do I brace my front knee?", "movement": "cricket-bowling"}
    first = client.post("/api/v1/coach/ask", json=payload).json()
    second = client.post("/api/v1/coach/ask", json=payload).json()
    assert first["from_cache"] is False
    assert second["from_cache"] is True
    assert second["answer"] == first["answer"]
    assert len(fake_llm) == 1, "a cached question must not reach the model again"


def test_the_app_stays_usable_when_every_model_provider_is_down(client, no_llm):
    res = client.post("/api/v1/coach/ask", json={
        "question": "How do I brace my front knee?", "movement": "cricket-bowling"})
    assert res.status_code == 200
    assert res.json()["unavailable"] is True


def test_a_question_about_my_report_includes_my_own_numbers(client, fake_llm, report):
    saved = client.post("/api/v1/analyses", json=report).json()
    client.post("/api/v1/coach/ask", json={
        "question": "What should I work on first?", "analysis_id": saved["id"]})
    user = fake_llm[0][1]["content"]
    assert "Their latest report" in user
    assert "142" in user


def test_i_cannot_ask_about_someone_elses_report(client, as_bob, fake_llm, report):
    mine = client.post("/api/v1/analyses", json=report).json()
    res = as_bob.post("/api/v1/coach/ask",
                      json={"question": "What should I fix?", "analysis_id": mine["id"]})
    assert res.status_code == 404


def test_chat_is_kept_so_a_player_can_look_back(client, fake_llm):
    from app.history.models import ChatMessage
    from app.db.session import get_engine
    from sqlalchemy.orm import Session

    client.post("/api/v1/coach/ask", json={
        "question": "How do I brace my front knee?", "movement": "cricket-bowling"})
    with Session(get_engine()) as db:
        rows = db.query(ChatMessage).order_by(ChatMessage.id).all()
        assert [r.role for r in rows] == ["user", "assistant"]
        assert rows[1].sources


def test_suggested_questions_come_from_what_the_movement_checks(client):
    tips = client.get("/api/v1/coach/suggestions?movement=gym-squat").json()
    assert any("deep" in t.lower() for t in tips)


# ── the written summary ──────────────────────────────────────────────────────

def test_summary_is_written_once_then_kept(client, fake_llm, report):
    saved = client.post("/api/v1/analyses", json=report).json()
    first = client.post(f"/api/v1/analyses/{saved['id']}/summary").json()
    second = client.post(f"/api/v1/analyses/{saved['id']}/summary").json()
    assert first["summary"]
    assert second["summary"] == first["summary"]
    assert second["from_cache"] is True
    assert len(fake_llm) == 1


def test_summary_is_only_given_the_real_measurements(client, fake_llm, report):
    saved = client.post("/api/v1/analyses", json=report).json()
    client.post(f"/api/v1/analyses/{saved['id']}/summary")
    system, user = fake_llm[0]
    assert "Never invent measurements" in system["content"]
    assert "142" in user["content"]
    assert "Bowling action" in user["content"]


def test_a_report_is_still_complete_when_the_model_is_down(client, no_llm, report):
    saved = client.post("/api/v1/analyses", json=report).json()
    body = client.post(f"/api/v1/analyses/{saved['id']}/summary").json()
    assert body["summary"] is None
    assert body["unavailable"] is True
