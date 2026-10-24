"""Local link checks. No network. Official domains come only from backend/data/official_domains.json."""
import ipaddress
import json
import re
from urllib.parse import urlparse

from .. import config
from ..schemas import Evidence

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "cutt.ly", "rb.gy", "is.gd", "goo.gl", "shorturl.at", "ow.ly", "wa.me"}
URL_RE = re.compile(r"(?:https?://|www\.)[^\s<>\"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)+/[^\s<>\"']*", re.I)


def load_official() -> dict[str, list[str]]:
    """Return {org name: [domains]}. File format: [{"name": "...", "domains": ["..."]}]. Empty is fine."""
    try:
        data = json.loads(config.OFFICIAL_DOMAINS_FILE.read_text(encoding="utf-8"))
        return {d["name"]: [x.lower() for x in d["domains"]] for d in data}
    except Exception:
        return {}


def host_of(link: str) -> str:
    link = link.strip()
    if not re.match(r"^[a-z][a-z0-9+.-]*://", link, re.I):
        link = "http://" + link
    return (urlparse(link).hostname or "").lower().rstrip(".")


def _matches(host: str, domain: str) -> bool:
    return host == domain or host.endswith("." + domain)


def check_link(link: str) -> list[Evidence]:
    """Cheap, offline red-flag checks for one link."""
    out: list[Evidence] = []
    host = host_of(link)
    if not host:
        return out
    if link.strip().lower().startswith("http://"):
        out.append(Evidence(claim="link does not use https", source="link_heuristics", detail=link))
    try:
        ipaddress.ip_address(host)
        out.append(Evidence(claim="link is a raw IP address", source="link_heuristics", detail=host))
    except ValueError:
        pass
    if host in SHORTENERS:
        out.append(Evidence(claim="link is a URL shortener, real destination hidden", source="link_heuristics", detail=host))
    if host.startswith("xn--") or ".xn--" in host:
        out.append(Evidence(claim="link uses look-alike (punycode) characters", source="link_heuristics", detail=host))
    if host.count("-") >= 2 or host.count(".") >= 4:
        out.append(Evidence(claim="link looks like a made-up lookalike domain", source="link_heuristics", detail=host))

    official = load_official()
    if official:
        matched = next((n for n, ds in official.items() if any(_matches(host, d) for d in ds)), None)
        if matched:
            out.append(Evidence(claim=f"link matches official domain of {matched}", source="local_allowlist", detail=host))
        else:
            out.append(Evidence(claim="link is not on the local official-domain list", source="local_allowlist", detail="no match"))
    return out


def check_links(links: list[str]) -> list[Evidence]:
    ev: list[Evidence] = []
    for link in links[:5]:
        ev.extend(check_link(link))
    return ev


def find_links(text: str) -> list[str]:
    return [m.group(0).rstrip(".,)") for m in URL_RE.finditer(text or "")][:5]
