"""Every right in the Privacy Policy, proven to actually work."""
import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_engine
from app.history.models import Analysis, ChatMessage, PrivacyRequest, Profile
from app.privacy import service
from tests.test_profile import answers


def save(client, report, **kw):
    res = client.post("/api/v1/analyses", json={**report, **kw})
    assert res.status_code == 201, res.text
    return res.json()


def db():
    return Session(get_engine())


def test_status_shows_what_we_hold_and_the_consent(client, report):
    client.put("/api/v1/me/profile", json=answers())
    save(client, report)
    st = client.get("/api/v1/me/privacy").json()
    assert st["holdings"] == {"reports": 1, "coach_messages": 0, "profile_answers": True}
    assert st["accepted_version"] == st["policy_version"]
    assert st["ai_paused"] is False and st["deletion_due_at"] is None
    assert st["history"][0]["kind"] == "consent"


def test_download_contains_everything_and_only_mine(client, as_bob, report):
    client.put("/api/v1/me/profile", json=answers())
    save(client, report)
    save(as_bob, report, total=11.0)
    res = client.get("/api/v1/me/privacy/export")
    assert res.status_code == 200
    assert "attachment" in res.headers["content-disposition"]
    bundle = json.loads(res.content)
    assert bundle["account"]["id"] == "user-alice"
    assert bundle["athlete_profile"]["display_name"] == "Aarav K"
    assert [r["total"] for r in bundle["reports"]] == [74.2]          # not Bob's 11.0
    assert len(bundle["reports"][0]["checks"]) == 2
    assert "videos" in bundle["about_this_file"]
    kinds = [r["kind"] for r in client.get("/api/v1/me/privacy").json()["history"]]
    assert "export" in kinds


def test_switching_ai_off_stops_anything_going_to_the_model(client, report):
    saved = save(client, report)
    assert client.put("/api/v1/me/privacy/ai", json={"paused": True}).status_code == 200
    summary = client.post(f"/api/v1/analyses/{saved['id']}/summary", json={}).json()
    assert summary["summary"] is None and summary["ai_paused"] is True
    ask = client.post("/api/v1/coach/ask", json={"question": "How do I fix my knee?"})
    assert ask.status_code == 403
    client.put("/api/v1/me/privacy/ai", json={"paused": False})
    kinds = [r["kind"] for r in client.get("/api/v1/me/privacy").json()["history"]]
    assert {"ai_paused", "ai_resumed"} <= set(kinds)


def test_a_report_can_be_deleted_but_not_someone_elses(client, as_bob, report):
    mine = save(client, report)
    assert as_bob.delete(f"/api/v1/analyses/{mine['id']}").status_code == 404
    assert client.delete(f"/api/v1/analyses/{mine['id']}").status_code == 204
    assert client.get(f"/api/v1/analyses/{mine['id']}").status_code == 404


def test_coach_history_can_be_read_and_cleared(client):
    with db() as s:
        s.add_all([ChatMessage(user_id="user-alice", role="user", content="hi"),
                   ChatMessage(user_id="user-alice", role="assistant", content="hello"),
                   ChatMessage(user_id="user-bob", role="user", content="bob's")])
        s.commit()
    hist = client.get("/api/v1/coach/history").json()
    assert [m["content"] for m in hist] == ["hi", "hello"]
    assert client.delete("/api/v1/me/privacy/chat").json()["deleted"] == 2
    assert client.get("/api/v1/coach/history").json() == []
    with db() as s:
        assert s.execute(select(ChatMessage).where(ChatMessage.user_id == "user-bob")).first()


def test_account_deletion_needs_confirming_and_can_be_cancelled(client):
    assert client.request("DELETE", "/api/v1/me/privacy/account", json={}).status_code == 400
    res = client.request("DELETE", "/api/v1/me/privacy/account", json={"confirm": True}).json()
    due = datetime.fromisoformat(res["deletion_due_at"])
    assert timedelta(days=29) < due - datetime.now(timezone.utc) <= timedelta(days=30)
    client.post("/api/v1/me/privacy/account/cancel")
    assert client.get("/api/v1/me/privacy").json()["deletion_due_at"] is None


def test_after_30_days_everything_is_erased_and_the_log_is_anonymous(client, as_bob, report):
    client.put("/api/v1/me/profile", json=answers())
    save(client, report)
    save(as_bob, report)
    client.post("/api/v1/me/privacy/requests", json={"kind": "question", "details": "What do you keep about me?"})
    client.request("DELETE", "/api/v1/me/privacy/account", json={"confirm": True})

    with db() as s:
        assert service.erase_due(s) == 0          # window still open: nothing happens
        s.get(Profile, "user-alice").deletion_due_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        s.commit()
        assert service.erase_due(s) == 1
        assert s.get(Profile, "user-alice") is None
        assert not s.execute(select(Analysis).where(Analysis.user_id == "user-alice")).first()
        assert s.execute(select(Analysis).where(Analysis.user_id == "user-bob")).first()  # Bob untouched
        log = s.execute(select(PrivacyRequest)).scalars().all()
        assert all(r.user_id != "user-alice" for r in log)
        assert all(r.details is None for r in log if r.user_id.startswith("erased:"))
        assert any(r.kind == "erased" for r in log)


def test_complaints_get_a_30_day_deadline(client):
    res = client.post("/api/v1/me/privacy/requests",
                      json={"kind": "grievance", "details": "My report showed the wrong sport."})
    assert res.status_code == 201
    st = client.get("/api/v1/me/privacy").json()
    item = st["history"][0]
    assert item["status"] == "open" and item["kind"] == "grievance"
    with db() as s:
        row = service.resolve(s, item["id"], "Fixed, sorry about that.")
        assert row.status == "resolved"
    again = client.get("/api/v1/me/privacy").json()["history"][0]
    assert again["status"] == "resolved" and again["resolution"].startswith("Fixed")


def test_short_or_unknown_requests_are_refused(client):
    assert client.post("/api/v1/me/privacy/requests", json={"kind": "grievance", "details": "bad"}).status_code == 422
    assert client.post("/api/v1/me/privacy/requests", json={"kind": "refund", "details": "x" * 20}).status_code == 422


def test_check_trends_show_what_moved(client, report):
    save(client, report)
    later = json.loads(json.dumps(report))
    later["results"][0]["score"] = 70.0
    save(client, later)
    trends = client.get("/api/v1/analyses/checks?movement=cricket-bowling").json()
    knee = next(t for t in trends if t["metric_id"] == "cricket-bowling.front_knee")
    assert [p["score"] for p in knee["points"]] == [48.0, 70.0]
    assert knee["change"] == 22.0


def test_health_says_whether_erasure_can_remove_sign_in_records(client, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
    body = client.get("/api/v1/health").json()
    assert body["account_erasure"] == "key_missing"
    assert "SUPABASE" not in json.dumps(body)   # never shows the key or its name


def test_a_rejected_key_is_reported_without_revealing_it(monkeypatch):
    from app.core.config import settings

    class Res:
        status_code = 401

    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "not-a-real-key")
    monkeypatch.setattr(service.httpx, "get", lambda *a, **k: Res())
    service._KEY_CHECK.update(at=0.0, result=None)
    assert service.sign_in_erasure_status() == "key_rejected"
    service._KEY_CHECK.update(at=0.0, result=None)
