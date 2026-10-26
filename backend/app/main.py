import hmac
import logging

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config, pipeline
from .schemas import Result

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="Hifazat API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "mode": config.mode(),
        "model": config.LLM_MODEL,
        # What is actually switched on, so the site never claims a check that is not running.
        "checks": {
            "safe_browsing": bool(config.SAFE_BROWSING_API_KEY),
            "web_search": config.ENABLE_WEB_CHECK and bool(config.TAVILY_API_KEY),
            "agents": config.USE_AGENT_VERIFY,
            "listener": bool(config.LISTEN_TOKEN),
        },
    }


@app.post("/api/analyze", response_model=Result)
async def analyze(
    image: UploadFile | None = File(None),
    text: str = Form(""),
    question: str = Form(""),
    web_check: bool = Form(False),
    lang: str = Form("ur"),
):
    raw = await image.read() if image is not None and image.filename else None
    if raw is not None and len(raw) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large (max 8 MB)")
    if not raw and not text.strip():
        raise HTTPException(400, "Send an image or some text")
    return await pipeline.analyze(raw or None, text, question, web_check, lang)


class ListenIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    sender: str = ""
    lang: str = "ur"


class ListenOut(BaseModel):
    verdict: str
    red_flags: list[str]
    summary: str
    what_to_do: str


@app.post("/api/listen", response_model=ListenOut)
async def listen(body: ListenIn, x_listen_token: str = Header("")):
    """Webhook for a phone automation app: it posts each new SMS here and shows the verdict as a notification.
    Disabled unless LISTEN_TOKEN is set. Nothing is stored."""
    if not config.LISTEN_TOKEN:
        raise HTTPException(404, "Listener is not enabled")
    if not hmac.compare_digest(x_listen_token.encode(), config.LISTEN_TOKEN.encode()):
        raise HTTPException(401, "Bad token")
    text = f"From: {body.sender}\n{body.text}" if body.sender else body.text
    r = await pipeline.analyze(None, text, "", False, body.lang)
    return ListenOut(verdict=r.verdict, red_flags=list(r.red_flags), summary=r.explanation_ur, what_to_do=r.what_to_do_ur)
