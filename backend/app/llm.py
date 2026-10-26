"""Gemma 4 access through the OpenAI-compatible endpoint set in .env. Gemma is the only model."""
import base64
import asyncio
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


def _objects(text: str):
    """Yield every top-level {...} span in the text that parses as JSON."""
    i = 0
    while (start := text.find("{", i)) >= 0:
        depth, in_str, esc = 0, False, False
        for j in range(start, len(text)):
            c = text[j]
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
                    try:
                        yield json.loads(text[start : j + 1])
                    except ValueError:
                        pass
                    i = j + 1
                    break
        else:
            return
        if depth != 0:
            i = start + 1


def first_json(text: str) -> dict:
    """Pull the answer JSON out of a model reply (handles code fences, chatter and Gemma's <thought> blocks)."""
    text = re.sub(r"<thought>.*?</thought>", "", text, flags=re.S)
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    found = [o for o in _objects(text) if isinstance(o, dict)]
    if not found:
        raise ValueError("no JSON object in model output")
    return found[-1]  # the answer comes after any reasoning, so the last object wins


async def ask_json(system: str, user: str, image_url: str | None = None, attempts: int = 3) -> dict:
    """One Gemma call that must return a JSON object. Image goes BEFORE text. Retries once."""
    content: list[dict] = []
    if image_url:
        content.append({"type": "image_url", "image_url": {"url": image_url}})
    content.append({"type": "text", "text": user})
    messages = [{"role": "system", "content": system}, {"role": "user", "content": content}]
    last: Exception | None = None
    # Gemma 4 "thinks" by default; on local Ollama that is ~10x slower (2 tok/s on CPU) and eats max_tokens.
    extra = {"extra_body": {"reasoning_effort": "none"}} if config.mode() == "local" else {}
    for i in range(attempts):
        if i:
            await asyncio.sleep(2 * i)  # hosted Gemma sometimes answers 503/429 under load
        try:
            try:
                resp = await client.chat.completions.create(
                    model=config.LLM_MODEL, messages=messages, temperature=0, max_tokens=config.LLM_MAX_TOKENS,
                    response_format={"type": "json_object"}, **extra,
                )
            except Exception as e:  # some servers reject response_format
                if "response_format" not in str(e).lower():
                    raise
                resp = await client.chat.completions.create(
                    model=config.LLM_MODEL, messages=messages, temperature=0, max_tokens=config.LLM_MAX_TOKENS, **extra
                )
            return first_json(resp.choices[0].message.content or "")
        except Exception as e:
            last = e
    raise RuntimeError(f"Gemma call failed: {last}")
