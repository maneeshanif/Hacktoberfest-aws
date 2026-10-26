"""Google Safe Browsing lookup. Only extracted link text is sent. Returns [] on any problem or when no key is set."""
import httpx

from .. import config
from ..schemas import Evidence

URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
THREATS = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"]


async def check(links: list[str]) -> list[Evidence]:
    if not (config.SAFE_BROWSING_API_KEY and links):
        return []
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
    except Exception:
        return []
    return [
        Evidence(
            claim=f"Google Safe Browsing lists this link as {m.get('threatType', 'unsafe').replace('_', ' ').lower()}",
            source="safe_browsing",
            detail=m.get("threat", {}).get("url", ""),
        )
        for m in matches
    ]
