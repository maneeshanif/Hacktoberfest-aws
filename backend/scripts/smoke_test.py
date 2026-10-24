"""Does Gemma 4 actually SEE the image? Run from repo root:

    cd backend && uv run python scripts/smoke_test.py ../samples/scam_sms.png
"""
import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import config, llm  # noqa: E402

PROMPT = (
    "Describe exactly what text you can read in this image. Then answer in JSON: "
    '{"seen": "<the text you read>", "verdict": "safe|suspicious|scam", "explanation_ur": "<one short Urdu sentence>"}'
)


async def main(path: str) -> int:
    print(f"endpoint={config.LLM_BASE_URL} model={config.LLM_MODEL} mode={config.mode()}")
    url = llm.prep_image(Path(path).read_bytes())
    t = time.perf_counter()
    out = await llm.ask_json("You read screenshots and reply with JSON only.", PROMPT, url)
    print(out)
    print(f"{time.perf_counter() - t:.1f}s")
    ok = bool(str(out.get("seen", "")).strip())
    print("PASS: the model read the image" if ok else "FAIL: no text read (image ignored? see README troubleshooting)")
    return 0 if ok else 1


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: python scripts/smoke_test.py <image>")
    sys.exit(asyncio.run(main(sys.argv[1])))
