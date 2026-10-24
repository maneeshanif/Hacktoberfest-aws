# CLAUDE.md

Follow `AGENTS.md` and `docs/prd/PRD.md`.

**Hard rule:** Gemma 4 is the only model used in this project, through the OpenAI-compatible endpoint configured in `.env`
(local Ollama `gemma4:e4b` by default). No other model vendor, no hardcoded keys. A verdict is never "guaranteed safe"; on failure return `suspicious`.
