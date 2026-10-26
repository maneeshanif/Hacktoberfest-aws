import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import config, llm, pipeline
from app.main import app
from app.schemas import Evidence, Result
from app.tools import domains

@pytest.fixture(autouse=True)
def isolate_from_env(monkeypatch):
    """Tests must never reach real services just because the developer's .env turns them on."""
    monkeypatch.setattr(config, "ENABLE_WEB_CHECK", False)
    monkeypatch.setattr(config, "USE_AGENT_VERIFY", False)
    monkeypatch.setattr(config, "SAFE_BROWSING_API_KEY", "")
    monkeypatch.setattr(config, "TAVILY_API_KEY", "")
    monkeypatch.setattr(config, "LISTEN_TOKEN", "")


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
    monkeypatch.setattr(config, "ENABLE_WEB_CHECK", False)
    monkeypatch.setattr(config, "USE_AGENT_VERIFY", False)
    checks = TestClient(app).get("/api/health").json()["checks"]
    assert checks == {"safe_browsing": False, "web_search": False, "agents": False, "listener": False}


def test_english_prompt_does_not_ask_for_urdu():
    from app import prompts

    en, ur = prompts.system("en"), prompts.system("ur")
    assert "short Urdu (script" not in en and "short English" in en
    assert "short Urdu (script" in ur


async def test_web_search_runs_when_server_enables_it_and_client_is_silent(monkeypatch):
    patch(monkeypatch, SCAM)
    calls = []

    async def fake_reports(terms):
        calls.append(terms)
        return [Evidence(claim="web result: x", source="tavily", detail="https://x.example")]

    monkeypatch.setattr(config, "ENABLE_WEB_CHECK", True)
    monkeypatch.setattr(pipeline.web_search, "scam_reports", fake_reports)
    res = await pipeline.analyze(None, "visit http://hbl-secure-login.example now", "", None)
    assert calls and any(e.source == "tavily" for e in res.evidence)

    calls.clear()
    await pipeline.analyze(None, "visit http://hbl-secure-login.example now", "", False)
    assert not calls  # an explicit "no" from the client wins


def _hits(*items):
    return [{"title": t, "content": c, "url": u} for t, c, u in items]


async def test_web_search_drops_irrelevant_hits_and_keeps_matching_ones(monkeypatch):
    from app.tools import web_search

    monkeypatch.setattr(config, "TAVILY_API_KEY", "x")
    monkeypatch.setattr(
        web_search,
        "_search",
        lambda term, kind: _hits(
            ("Report on hbl-secure-login.top", "phishing site", "https://scamverif.example/hbl-secure-login.top"),
            ("Instagram reel", "dance video", "https://instagram.example/reel/1"),
        ),
    )
    ev = await web_search.scam_reports(["hbl-secure-login.top"])
    assert [e.source for e in ev] == ["tavily"] and "hbl-secure-login.top" in ev[0].claim


async def test_web_search_says_so_when_nothing_relevant_is_found(monkeypatch):
    from app.tools import web_search

    monkeypatch.setattr(config, "TAVILY_API_KEY", "x")
    monkeypatch.setattr(web_search, "_search", lambda term, kind: _hits(("Stock price", "shares", "https://invest.example")))
    ev = await web_search.scam_reports(["0300-1234567"])
    assert len(ev) == 1 and "No public scam reports" in ev[0].claim and "not mean it is safe" in ev[0].claim


async def test_web_search_skips_generic_sender_names_and_failures(monkeypatch):
    from app.tools import web_search

    monkeypatch.setattr(config, "TAVILY_API_KEY", "x")

    def boom(term, kind):
        raise RuntimeError("down")

    monkeypatch.setattr(web_search, "_search", boom)
    assert await web_search.scam_reports(["Bank", "", "evil.top"]) == []  # only evil.top is searched, and it failed


async def test_checks_run_lists_only_checks_that_really_ran(monkeypatch):
    patch(monkeypatch, SCAM)
    monkeypatch.setattr(config, "ENABLE_WEB_CHECK", False)

    async def not_run(links):
        return None  # no key, or the lookup failed

    monkeypatch.setattr(pipeline.safe_browsing, "check", not_run)
    res = await pipeline.analyze(None, "see http://hbl-secure-login.example", "", None)
    assert res.checks_run == ["link_heuristics"]

    async def clean(links):
        return []

    monkeypatch.setattr(pipeline.safe_browsing, "check", clean)
    res = await pipeline.analyze(None, "see http://hbl-secure-login.example", "", None)
    assert res.checks_run == ["link_heuristics", "safe_browsing"]


async def test_no_web_search_for_a_message_with_no_link_or_number(monkeypatch):
    patch(monkeypatch, {**SCAM, "extracted": {"links": [], "phones": [], "claimed_sender": "Mum", "asks_for": [], "urgency": False}})
    monkeypatch.setattr(config, "ENABLE_WEB_CHECK", True)
    seen = []

    async def spy(terms):
        seen.append(terms)
        return []

    monkeypatch.setattr(pipeline.web_search, "scam_reports", spy)
    await pipeline.analyze(None, "Dinner at 8? Mum is cooking", "", None)
    assert seen == [[]]  # called with nothing to search, so a bare sender name triggers no query
