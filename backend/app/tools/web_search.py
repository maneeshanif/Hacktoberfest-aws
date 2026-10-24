"""Optional Tavily scam-report lookup. Only extracted text (link host, phone, brand) is ever sent. Never the image."""
import asyncio

from .. import config
from ..schemas import Evidence


def _search(query: str) -> list[Evidence]:
    from tavily import TavilyClient

    res = TavilyClient(api_key=config.TAVILY_API_KEY).search(query=query, max_results=3, search_depth="basic")
    return [
        Evidence(claim=f"web result: {r.get('title', '')[:100]}", source="tavily", detail=r.get("url", ""))
        for r in res.get("results", [])
    ]


async def scam_reports(terms: list[str]) -> list[Evidence]:
    """Search '<term> scam' for up to 2 extracted terms. Returns [] on any problem."""
    if not (config.TAVILY_API_KEY and terms):
        return []
    out: list[Evidence] = []
    for term in terms[:2]:
        try:
            out.extend(await asyncio.wait_for(asyncio.to_thread(_search, f"{term} scam Pakistan"), timeout=8))
        except Exception:
            continue
    return out
