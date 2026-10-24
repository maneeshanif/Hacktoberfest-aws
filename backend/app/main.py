import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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
    return {"ok": True, "mode": config.mode(), "model": config.LLM_MODEL}


@app.post("/api/analyze", response_model=Result)
async def analyze(
    image: UploadFile | None = File(None),
    text: str = Form(""),
    question: str = Form(""),
    web_check: bool = Form(False),
):
    raw = await image.read() if image is not None and image.filename else None
    if raw is not None and len(raw) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large (max 8 MB)")
    if not raw and not text.strip():
        raise HTTPException(400, "Send an image or some text")
    return await pipeline.analyze(raw or None, text, question, web_check)
