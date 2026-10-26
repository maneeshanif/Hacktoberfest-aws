"""Settings, read once from the environment (root .env is loaded if present)."""
import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "backend" / ".env")


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "ollama")
LLM_MODEL = os.getenv("LLM_MODEL", "gemma4:e4b")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "90"))
# Hosted Gemma 4 always "thinks" and thought tokens count against this budget.
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4000"))

ENABLE_WEB_CHECK = _bool("ENABLE_WEB_CHECK", False)
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
# Optional: Google Safe Browsing v4 key. A listed link is hard evidence of a scam.
SAFE_BROWSING_API_KEY = os.getenv("SAFE_BROWSING_API_KEY", "")
# Optional: run the verify step through the OpenAI Agents SDK (same Gemma endpoint).
USE_AGENT_VERIFY = _bool("USE_AGENT_VERIFY", False)

# Optional: shared secret for POST /api/listen, the webhook a phone automation app (Tasker, MacroDroid, Shortcuts)
# calls for each new SMS. Unset = the endpoint is disabled.
LISTEN_TOKEN = os.getenv("LISTEN_TOKEN", "")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
OFFICIAL_DOMAINS_FILE = ROOT / "backend" / "data" / "official_domains.json"

MAX_IMAGE_EDGE = 1024
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


def mode() -> str:
    host = urlparse(LLM_BASE_URL).hostname or ""
    return "local" if host in {"localhost", "127.0.0.1", "::1", "host.docker.internal"} else "hosted"
