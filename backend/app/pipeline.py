"""EXTRACT -> ADVERSARIAL VERIFY -> JUDGE.

1. Prosecutor + Defense (run in parallel): one hunts for scam patterns and extracts the facts, the other for legitimacy.
3. Verification: Local link checks & optional web searches.
4. Judge Agent: Weighs all arguments and tool evidence to give a human-friendly verdict.

Any failure returns `suspicious`, never `safe`.
"""
import asyncio
import json
import logging
import time

from . import agent_verify, config, llm, prompts
from .schemas import FALLBACK, FALLBACK_EN, RED_FLAGS, Evidence, Extracted, Result
from .tools import domains, safe_browsing, web_search

log = logging.getLogger("hifazat")
BAD_SOURCES = {"link_heuristics", "safe_browsing"}


def _coerce(raw: dict) -> Result:
    ex = raw.get("extracted") or {}
    extracted = Extracted(
        links=[str(x) for x in ex.get("links", []) or []][:5],
        phones=[str(x) for x in ex.get("phones", []) or []][:5],
        claimed_sender=str(ex.get("claimed_sender") or ""),
        asks_for=[str(x) for x in ex.get("asks_for", []) or []][:6],
        urgency=bool(ex.get("urgency", False)),
    )
    verdict = raw.get("verdict")
    return Result(
        verdict=verdict if verdict in {"safe", "suspicious", "scam"} else "suspicious",
        red_flags=[f for f in raw.get("red_flags", []) or [] if f in RED_FLAGS],
        explanation_ur=str(raw.get("explanation_ur") or ""),
        what_to_do_ur=str(raw.get("what_to_do_ur") or ""),
        family_warning_ur=str(raw.get("family_warning_ur") or ""),
        extracted=extracted,
    )


def safety_net(result: Result, evidence: list[Evidence], lang: str = "ur") -> Result:
    """Never let a message with red flags or bad link evidence come out as `safe`."""
    bad = [e for e in evidence if e.source in BAD_SOURCES]
    if bad and "unofficial_link" not in result.red_flags:
        result.red_flags.append("unofficial_link")
    if result.verdict == "safe" and (result.red_flags or bad):
        result.verdict = "suspicious"
    if any(e.source == "safe_browsing" for e in evidence):  # known-bad link overrides everything
        result.verdict = "scam"
    if result.verdict == "scam" and not result.red_flags:
        result.verdict = "suspicious"
    fallback = FALLBACK_EN if lang == "en" else FALLBACK
    if not result.explanation_ur or not result.what_to_do_ur:
        result.explanation_ur = result.explanation_ur or fallback.explanation_ur
        result.what_to_do_ur = result.what_to_do_ur or fallback.what_to_do_ur
        if result.verdict == "safe":
            result.verdict = "suspicious"
    result.family_warning_ur = result.family_warning_ur or fallback.family_warning_ur
    return result


async def _verify(extracted: Extracted, text: str, web_check: bool) -> list[Evidence]:
    links = list(dict.fromkeys(extracted.links + domains.find_links(text)))[:5]
    evidence = domains.check_links(links) + await safe_browsing.check(links)
    if not web_check:
        return evidence
    if config.USE_AGENT_VERIFY:
        try:
            return evidence + [e for e in await agent_verify.run(extracted, True) if e.source == "tavily"]
        except Exception as e:
            log.warning("agent verify failed, using direct tools: %s", e)
    terms = [domains.host_of(l) for l in links[:1]] + extracted.phones[:1] + [extracted.claimed_sender]
    return evidence + await web_search.scam_reports([t for t in terms if t])


async def analyze(image: bytes | None, text: str, question: str, web_check: bool, lang: str = "ur") -> Result:
    lang = "en" if lang == "en" else "ur"
    t0 = time.perf_counter()
    web_check = web_check and config.ENABLE_WEB_CHECK
    try:
        image_url = llm.prep_image(image) if image else None

        # 1+2. PROSECUTOR (also extracts the facts) and DEFENSE argue independently
        user = prompts.user_text(text, question)
        prosecutor_raw, defense_raw = await asyncio.gather(
            llm.ask_json(prompts.system(lang, role="prosecutor"), user, image_url),
            llm.ask_json(prompts.system(lang, role="defense"), user, image_url),
        )
        extracted = _coerce(prosecutor_raw).extracted

        # 3. VERIFY: tool-based evidence
        evidence = await _verify(extracted, text, web_check)
        evidence_json = json.dumps([e.model_dump() for e in evidence], ensure_ascii=False)

        # 4. JUDGE: weigh both arguments and the tool evidence
        judge_raw = await llm.ask_json(
            prompts.system(lang, role="judge"),
            prompts.judge_user_text(
                json.dumps(prosecutor_raw, ensure_ascii=False),
                json.dumps(defense_raw, ensure_ascii=False),
                text,
                evidence_json,
            ),
            image_url,
        )

        result = _coerce(judge_raw)
        if not (result.extracted.links or result.extracted.phones):
            result.extracted = extracted
        result.evidence = evidence
        result = safety_net(result, evidence, lang)

    except Exception as e:
        log.exception("analyze failed: %s", e)
        result = (FALLBACK_EN if lang == "en" else FALLBACK).model_copy(deep=True)

    result.mode = config.mode()
    result.latency_ms = int((time.perf_counter() - t0) * 1000)
    return result

