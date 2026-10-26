"""Optional Tavily scam-report lookup. Only extracted text (link host, phone, sender name) is ever sent. Never the image.

A search hit only counts when it actually mentions the thing we searched for: the first version returned Instagram
reels and stock pages for a phone number, which is noise Gemma should not have to weigh.
"""
import asyncio
import re

from .. import config
from ..schemas import Evidence

MAX_TERMS = 3
PER_TERM = 2
GENERIC_SENDERS = {"", "bank", "unknown", "sender", "company", "government", "telecom", "n/a", "none"}


def _digits(s: str) -> str:
    return re.sub(r"\D", "", s)


def _kind(term: str) -> str:
    if len(_digits(term)) >= 9 and not re.search(r"[a-z]{3,}", term, re.I):
        return "phone"
    if "." in term and " " not in term.strip():
        return "link"
    return "name"


def _query(term: str, kind: str) -> str:
    if kind == "link":
        return f'"{term}" phishing scam'
    if kind == "phone":
        return f'"{term}" scam Pakistan'
    return f'"{term}" scam message Pakistan'


def _relevant(term: str, kind: str, hit: dict) -> bool:
    blob = " ".join(str(hit.get(k, "")) for k in ("title", "content", "url")).lower()
    if kind == "phone":
        return _digits(term)[-10:] in _digits(blob)
    return term.lower() in blob


def _search(term: str, kind: str) -> list[dict]:
    from tavily import TavilyClient

    res = TavilyClient(api_key=config.TAVILY_API_KEY).search(query=_query(term, kind), max_results=5, search_depth="basic")
    return res.get("results", [])


async def _one(term: str) -> list[Evidence]:
    kind = _kind(term)
    try:
        hits = await asyncio.wait_for(asyncio.to_thread(_search, term, kind), timeout=8)
    except Exception:
        return []  # a failed search says nothing, so it adds no evidence either way
    good = [h for h in hits if _relevant(term, kind, h)][:PER_TERM]
    if not good:
        return [Evidence(claim=f'No public scam reports found for "{term}". This does not mean it is safe.', source="tavily", detail="")]
    return [Evidence(claim=h.get("title", "")[:110] or term, source="tavily", detail=h.get("url", "")) for h in good]


async def scam_reports(terms: list[str]) -> list[Evidence]:
    """Search up to MAX_TERMS extracted terms in parallel. Returns [] on any problem."""
    if not config.TAVILY_API_KEY:
        return []
    terms = [t.strip() for t in dict.fromkeys(terms) if t and t.strip().lower() not in GENERIC_SENDERS][:MAX_TERMS]
    if not terms:
        return []
    out: list[Evidence] = []
    for found in await asyncio.gather(*(_one(t) for t in terms)):
        out.extend(found)
    return out
