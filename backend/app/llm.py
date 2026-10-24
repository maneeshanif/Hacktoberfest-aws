"""Gemma 4 access through the OpenAI-compatible endpoint set in .env. Gemma is the only model."""
import base64
import io
import json
import re

from openai import AsyncOpenAI
from PIL import Image, ImageOps

from . import config

client = AsyncOpenAI(base_url=config.LLM_BASE_URL, api_key=config.LLM_API_KEY, timeout=config.LLM_TIMEOUT)


def prep_image(raw: bytes) -> str:
    """Resize (long edge <= 1024), flatten to RGB JPEG, return a data URL."""
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(raw)))
    img = img.convert("RGB")
    img.thumbnail((config.MAX_IMAGE_EDGE, config.MAX_IMAGE_EDGE))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def first_json(text: str) -> dict:
    """Pull the first JSON object out of a model reply (handles code fences and chatter)."""
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    start = text.find("{")
    if start < 0:
        raise ValueError("no JSON object in model output")
    depth, in_str, esc = 0, False, False
    for i in range(start, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : i + 1])
    raise ValueError("unterminated JSON object")


async def ask_json(system: str, user: str, image_url: str | None = None, attempts: int = 2) -> dict:
    """One Gemma call that must return a JSON object. Image goes BEFORE text. Retries once."""
    content: list[dict] = []
    if image_url:
        content.append({"type": "image_url", "image_url": {"url": image_url}})
    content.append({"type": "text", "text": user})
    messages = [{"role": "system", "content": system}, {"role": "user", "content": content}]
    last: Exception | None = None
    # Gemma 4 "thinks" by default; on local Ollama that is ~10x slower (2 tok/s on CPU) and eats max_tokens.
    extra = {"extra_body": {"reasoning_effort": "none"}} if config.mode() == "local" else {}
    for _ in range(attempts):
        try:
            try:
                resp = await client.chat.completions.create(
                    model=config.LLM_MODEL, messages=messages, temperature=0, max_tokens=1000,
                    response_format={"type": "json_object"}, **extra,
                )
            except Exception as e:  # some servers reject response_format
                if "response_format" not in str(e).lower():
                    raise
                resp = await client.chat.completions.create(
                    model=config.LLM_MODEL, messages=messages, temperature=0, max_tokens=1000, **extra
                )
            return first_json(resp.choices[0].message.content or "")
        except Exception as e:
            last = e
    raise RuntimeError(f"Gemma call failed: {last}")
