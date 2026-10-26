"""Google Safe Browsing lookup. Only extracted link text is sent.

Returns [] when nothing is listed, and None when the lookup could not run (no key, or the request failed), so the
caller never reports a clean "no match" for a check that did not happen."""
import logging

import httpx

from .. import config
from ..schemas import Evidence

log = logging.getLogger("hifazat")
URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
THREATS = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"]


async def check(links: list[str]) -> list[Evidence] | None:
    if not (config.SAFE_BROWSING_API_KEY and links):
        return None
    body = {
        "client": {"clientId": "hifazat", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": THREATS,
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": l} for l in links[:5]],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(URL, params={"key": config.SAFE_BROWSING_API_KEY}, json=body)
            r.raise_for_status()
            matches = r.json().get("matches", [])
    except Exception as e:
        # Log the class only: httpx error text contains the request URL, which carries the API key.
        status = getattr(getattr(e, "response", None), "status_code", "")
        log.warning("safe browsing lookup failed: %s %s", type(e).__name__, status)
        return None
    return [
        Evidence(
            claim=f"Google Safe Browsing lists this link as {m.get('threatType', 'unsafe').replace('_', ' ').lower()}",
            source="safe_browsing",
            detail=m.get("threat", {}).get("url", ""),
        )
        for m in matches
    ]
