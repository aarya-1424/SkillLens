"""Parent or guardian confirmation by email, for under-18s."""
from datetime import date, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core import mailer
from app.db.session import get_engine
from app.history.models import AthleteProfile
from tests.test_profile import answers

YOUNG = dict(birth_year=date.today().year - 15, guardian_name="Priya K",
             guardian_email="priya@example.com", guardian_consent=True)


@pytest.fixture
def outbox(monkeypatch):
    sent = []
    monkeypatch.setattr(mailer, "send", lambda to, subject, text, html=None: sent.append((to, text)) or True)
    return sent


def link_token(outbox):
    text = outbox[-1][1]
    return text.split("/parent/")[1].split()[0]


def test_adults_need_no_confirmation(client, outbox):
    out = client.put("/api/v1/me/profile", json=answers()).json()
    assert out["guardian_status"] == "not_needed" and outbox == []


def test_a_child_is_emailed_and_nothing_is_saved_until_the_parent_agrees(client, outbox, report):
    out = client.put("/api/v1/me/profile", json=answers(**YOUNG)).json()
    assert out["guardian_status"] == "pending" and out["guardian_email_hint"] == "p****@example.com"
    assert outbox[0][0] == "priya@example.com"

    assert client.post("/api/v1/analyses", json=report).status_code == 403
    assert client.post("/api/v1/coach/ask", json={"question": "How do I land?"}).status_code == 403

    token = link_token(outbox)
    page = client.get(f"/api/v1/guardian/{token}").json()
    assert page["child"] == "Aarav" and page["status"] == "pending"
    assert client.post(f"/api/v1/guardian/{token}", json={"agree": True}).json()["status"] == "confirmed"

    assert client.post("/api/v1/analyses", json=report).status_code == 201
    kinds = [h["kind"] for h in client.get("/api/v1/me/privacy").json()["history"]]
    assert "guardian_confirmed" in kinds


def test_a_parent_can_say_no(client, outbox, report):
    client.put("/api/v1/me/profile", json=answers(**YOUNG))
    client.post(f"/api/v1/guardian/{link_token(outbox)}", json={"agree": False})
    assert client.get("/api/v1/me/profile").json()["guardian_status"] == "declined"
    assert client.post("/api/v1/analyses", json=report).status_code == 403


def test_saving_again_does_not_resend_but_a_new_email_does(client, outbox):
    client.put("/api/v1/me/profile", json=answers(**YOUNG))
    client.put("/api/v1/me/profile", json=answers(**YOUNG, training_days=5))
    assert len(outbox) == 1
    client.put("/api/v1/me/profile", json=answers(**{**YOUNG, "guardian_email": "other@example.com"}))
    assert len(outbox) == 2 and outbox[-1][0] == "other@example.com"


def test_old_links_stop_working_and_links_expire(client, outbox):
    client.put("/api/v1/me/profile", json=answers(**YOUNG))
    old = link_token(outbox)
    with Session(get_engine()) as db:              # pretend the last email went long ago
        db.get(AthleteProfile, "user-alice").guardian_email_sent_at = None
        db.commit()
    assert client.post("/api/v1/me/guardian/resend").json()["sent"] is True
    assert client.get(f"/api/v1/guardian/{old}").status_code == 404
    new = link_token(outbox)
    with Session(get_engine()) as db:
        row = db.get(AthleteProfile, "user-alice")
        row.guardian_token_expires_at = row.guardian_token_expires_at - timedelta(days=15)
        db.commit()
    assert client.get(f"/api/v1/guardian/{new}").status_code == 410


def test_resending_too_quickly_is_refused(client, outbox):
    client.put("/api/v1/me/profile", json=answers(**YOUNG))
    assert client.post("/api/v1/me/guardian/resend").status_code == 429


def test_no_email_service_means_we_say_so(client, monkeypatch):
    monkeypatch.setattr(mailer, "configured", lambda: False)
    out = client.put("/api/v1/me/profile", json=answers(**YOUNG)).json()
    assert out["guardian_status"] == "pending" and out["guardian_email_sent"] is False
