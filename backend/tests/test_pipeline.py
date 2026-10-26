import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import config, llm, pipeline
from app.main import app
from app.schemas import Evidence, Result
from app.tools import domains

SCAM = {
    "verdict": "scam",
    "red_flags": ["asks_otp_pin_cnic_card", "urgency_threat", "made_up_flag"],
    "explanation_ur": "یہ پیغام کوڈ مانگ رہا ہے۔",
    "what_to_do_ur": "کوڈ نہ بتائیں۔",
    "family_warning_ur": "⚠️ ہوشیار!",
    "extracted": {"links": ["http://hbl-secure-login.example"], "phones": [], "claimed_sender": "Bank", "asks_for": ["OTP"], "urgency": True},
}


def png() -> bytes:
    b = io.BytesIO()
    Image.new("RGB", (2000, 1200), "white").save(b, "PNG")
    return b.getvalue()


def patch(monkeypatch, reply=None, fail=False):
    async def fake(system, user, image_url=None, attempts=2):
        if fail:
            raise RuntimeError("down")
        fake.calls.append(image_url)
        return dict(reply)
    fake.calls = []
    monkeypatch.setattr(llm, "ask_json", fake)
    return fake


def test_first_json_handles_fences():
    assert llm.first_json('hi ```json\n{"a": {"b": "}"}}\n``` bye') == {"a": {"b": "}"}}


def test_prep_image_resizes():
    url = llm.prep_image(png())
    assert url.startswith("data:image/jpeg;base64,")


def test_link_heuristics():
    claims = [e.claim for e in domains.check_link("http://bit.ly/x")]
    assert any("shortener" in c for c in claims) and any("https" in c for c in claims)
    assert any("raw IP" in e.claim for e in domains.check_link("http://192.168.1.1/login"))


def test_safety_net_never_safe_with_flags():
    r = Result(verdict="safe", red_flags=["urgency_threat"], explanation_ur="x", what_to_do_ur="y")
    assert pipeline.safety_net(r, []).verdict == "suspicious"
    r = Result(verdict="safe", explanation_ur="x", what_to_do_ur="y")
    ev = [Evidence(claim="link is a raw IP address", source="link_heuristics")]
    assert pipeline.safety_net(r, ev).verdict == "suspicious"


async def test_scam_flow_image_first_and_flags_filtered(monkeypatch):
    fake = patch(monkeypatch, SCAM)
    res = await pipeline.analyze(png(), "", "", False)
    assert res.verdict == "scam"
    assert "made_up_flag" not in res.red_flags
    assert fake.calls[0].startswith("data:image/jpeg")
    assert any(e.source == "link_heuristics" for e in res.evidence)
    assert res.latency_ms >= 0


async def test_failure_returns_suspicious_not_safe(monkeypatch):
    patch(monkeypatch, fail=True)
    res = await pipeline.analyze(None, "hello", "", False)
    assert res.verdict == "suspicious" and res.explanation_ur


async def test_bad_verdict_value_becomes_suspicious(monkeypatch):
    patch(monkeypatch, {**SCAM, "verdict": "definitely fine"})
    assert (await pipeline.analyze(None, "hi", "", False)).verdict == "suspicious"


def test_api(monkeypatch):
    patch(monkeypatch, SCAM)
    c = TestClient(app)
    assert c.get("/api/health").json()["ok"] is True
    assert c.post("/api/analyze", data={}).status_code == 400
    r = c.post("/api/analyze", files={"image": ("a.png", png(), "image/png")}, data={"question": "is this ok?"})
    assert r.status_code == 200
    body = r.json()
    assert body["verdict"] == "scam" and set(body) >= {"red_flags", "explanation_ur", "what_to_do_ur", "family_warning_ur", "extracted", "evidence", "mode", "latency_ms"}
    r = c.post("/api/analyze", data={"text": "Your account is blocked, send OTP"})
    assert r.status_code == 200


async def test_web_check_flow_feeds_judge(monkeypatch):
    fake = patch(monkeypatch, SCAM)
    monkeypatch.setattr(config, "ENABLE_WEB_CHECK", True)

    async def fake_reports(terms):
        return [Evidence(claim="web result: scam report", source="tavily", detail="https://x")]
    monkeypatch.setattr(pipeline.web_search, "scam_reports", fake_reports)
    res = await pipeline.analyze(None, "see http://hbl-secure-login.example", "", True)
    assert len(fake.calls) == 3  # prosecutor, defense, judge
    assert any(e.source == "tavily" for e in res.evidence)


def test_safety_net_scam_needs_a_red_flag():
    r = Result(verdict="scam", explanation_ur="x", what_to_do_ur="y")
    assert pipeline.safety_net(r, []).verdict == "suspicious"


async def test_safe_browsing_hit_forces_scam(monkeypatch):
    patch(monkeypatch, {**SCAM, "verdict": "suspicious"})

    async def fake_check(links):
        return [Evidence(claim="Google Safe Browsing lists this link as social engineering", source="safe_browsing")]
    monkeypatch.setattr(pipeline.safe_browsing, "check", fake_check)
    res = await pipeline.analyze(None, "see http://hbl-secure-login.example", "", False)
    assert res.verdict == "scam"


def test_first_json_skips_thoughts_and_takes_the_answer():
    reply = '<thought>try {"verdict": "safe"} first... no, braces { here</thought>\nHere you go:\n```json\n{"verdict": "scam", "red_flags": []}\n```'
    assert llm.first_json(reply) == {"verdict": "scam", "red_flags": []}
    assert llm.first_json('<thought>unclosed {"a": 1}') == {"a": 1}
    with pytest.raises(ValueError):
        llm.first_json("no json here")


def test_listen_disabled_without_token(monkeypatch):
    monkeypatch.setattr(config, "LISTEN_TOKEN", "")
    r = TestClient(app).post("/api/listen", json={"text": "hello"}, headers={"X-Listen-Token": "x"})
    assert r.status_code == 404


def test_listen_rejects_bad_token_and_accepts_good(monkeypatch):
    monkeypatch.setattr(config, "LISTEN_TOKEN", "s3cret")
    patch(monkeypatch, SCAM)
    c = TestClient(app)
    assert c.post("/api/listen", json={"text": "hi"}, headers={"X-Listen-Token": "nope"}).status_code == 401
    assert c.post("/api/listen", json={"text": "hi"}).status_code == 401
    ok = c.post("/api/listen", json={"text": "send OTP now", "sender": "HBL"}, headers={"X-Listen-Token": "s3cret"})
    assert ok.status_code == 200
    body = ok.json()
    assert body["verdict"] == "scam" and "asks_otp_pin_cnic_card" in body["red_flags"]


def test_health_reports_active_checks(monkeypatch):
    monkeypatch.setattr(config, "SAFE_BROWSING_API_KEY", "")
    monkeypatch.setattr(config, "LISTEN_TOKEN", "")
    checks = TestClient(app).get("/api/health").json()["checks"]
    assert checks == {"safe_browsing": False, "web_search": False, "agents": config.USE_AGENT_VERIFY, "listener": False}


def test_english_prompt_does_not_ask_for_urdu():
    from app import prompts

    en, ur = prompts.system("en"), prompts.system("ur")
    assert "short Urdu (script" not in en and "short English" in en
    assert "short Urdu (script" in ur
