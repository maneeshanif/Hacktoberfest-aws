# Hifazat (حفاظت) — Product Requirements (Hackathon Lite)

**Tagline:** A private AI scam shield for your parents. / آپ کے والدین کی حفاظت
**Powered by Gemma 4.** License: MIT. Built for MLH Fest. Deadline: submit by 3:15 PM (internal hard stop 2:55 PM).

> This is a lite PRD (14 sections), not the full 38-section Honey's Spec Harness PRD. It keeps the harness structure that matters
> under time pressure: objectives, stack decision record, phases with exit tests, definition of done, and "considered and deferred".

---

## 1. Summary
Elderly and low-literacy Urdu speakers receive scam messages (fake bank SMS, OTP requests, prize and aid messages, "money sent by mistake").
Hifazat lets them paste or upload a screenshot (optionally speak or type a question). Gemma 4 reads it, checks the claims, and answers in
large, simple Urdu: **safe / suspicious / scam**, why, and one clear thing to do now. A scam shows a full-screen red alert and a
ready-to-forward warning for the family WhatsApp group.

## 2. Hard rules (must-haves from the MLH slides — miss one and we cannot win)
1. Public GitHub repo.
2. MIT license (file `LICENSE` at repo root).
3. **Gemma 4 does the work** — every analysis step goes through Gemma 4. Named at the top of README.
4. Submitted on MLH before 3:15 PM (we aim for 2:55 PM).

Judges look for: it works, it is interesting, shown running live. Never claim a verdict is guaranteed. Wording is "may be a scam".

## 3. Users and problem
- Primary: parents and grandparents who read little Urdu/English and cannot judge a suspicious message.
- Secondary: the adult child who gets "is this real?" screenshots by WhatsApp.
- Problem: scams use urgency and fake authority; victims lose money and PINs within minutes.

## 4. Scope
| Tier | Feature |
|---|---|
| **Must** | Paste (Ctrl+V) / upload / drag a screenshot or paste text; Gemma analysis; verdict card (green/orange/red); red flags matched; Urdu explanation; "what to do now"; full-screen red scam alert; huge RTL Urdu UI; "Forward to family" copy button |
| **Should** | Web verification of extracted links/phones/brand claims (Tavily) + local lookalike-domain check, shown as an "evidence" list; Urdu read-aloud (TTS) button |
| **Stretch** | Voice question input via Gemma 4 audio (E2B/E4B accept audio, up to 30 s); "how do I do X?" tab with numbered steps and a red circle on the screenshot |
| **Cut** | Accounts, database, history, deployment, mobile app, multi-language beyond Urdu/English |

## 5. Pipeline (extract → verify → verdict)
1. **EXTRACT** — one Gemma 4 vision call (image first, then text), JSON out: `links[]`, `phones[]`, `claimed_sender`, `asks_for[]`, `urgency`, `text_summary`.
2. **VERIFY** — tools: `check_domain(url)` (local, deterministic, lookalike vs `data/official_domains.json`) and `web_search(query)` (Tavily, optional).
   Run through the OpenAI Agents SDK as an agent with these two tools. **Fallback:** if Gemma tool-calling is flaky, call both tools directly in code. Same output.
3. **VERDICT** — one Gemma 4 call with extracted facts + evidence, JSON out (schema in section 8).

Red-flag enum: `asks_otp_pin_cnic_card`, `urgency_threat`, `unexpected_prize_or_aid`, `return_money_by_mistake`,
`impersonates_bank_telco_govt`, `unofficial_link`, `asks_to_install_app`.

## 6. Stack decision record
| Layer | Choice | Why | Rejected / deferred |
|---|---|---|---|
| Model | Gemma 4 via OpenAI-compatible endpoint | Meets must-have 3; one code path for local and hosted | Any non-Gemma model (breaks must-have 3) |
| Model client | `openai` Python SDK (`AsyncOpenAI`) + Agents SDK `OpenAIChatCompletionsModel` for the verify agent | Same code for Ollama `/v1` and hosted providers | Native `ollama` lib (fine, but no hosted switch) |
| Backend | FastAPI + pydantic | Fast, typed, one endpoint | — |
| Frontend | Next.js (App Router) + Tailwind, RTL | Team preference; owned by one person with a fixed API contract | **Fallback:** single static `index.html` served by FastAPI if Next.js is not rendering by 2:15 PM |
| OCR | None separate — Gemma reads text in the image | Fewer moving parts | Tesseract (Urdu pack) only if Gemma misreads in the smoke test |
| Web check | Tavily (`tavily-python`), toggle `ENABLE_WEB_CHECK` | Evidence beyond "the AI said so" | — |
| DB | None | Nothing to store in the demo | **Supabase** deferred. Trigger: need accounts or saved history |
| STT | Gemma 4 audio input (stretch) | Keeps Gemma doing the work | Browser Web Speech STT (Chrome sends audio to a cloud service; breaks the privacy pitch) |
| TTS | Browser `speechSynthesis`, only if an Urdu voice is installed (hide button otherwise) | Zero setup | Cloud TTS |

### 6.1 LLM configuration (env switch)
Local (default, privacy story): `LLM_BASE_URL=http://localhost:11434/v1`, `LLM_API_KEY=ollama`, `LLM_MODEL=gemma4:e4b` (use `gemma4:e2b` if slow).
Hosted (fallback if hardware is too slow): OpenRouter `LLM_BASE_URL=https://openrouter.ai/api/v1`, `LLM_MODEL=google/gemma-4-31b-it:free`
(a Gemma 4 listing exists on OpenRouter; verify the exact id and free-tier limits in your dashboard). Google AI Studio also lists `gemma-4-31b-it`.
**Privacy statement in README must match the mode:** local = screenshot never leaves the device; hosted = screenshot goes to the provider.
Web check only ever sends extracted link/phone/brand text, never the image.

Known risk: one Windows report found Ollama accepted an image but the model ignored it; fix was importing the model from a split GGUF + mmproj
file. Run `backend/scripts/smoke_test.py` first and confirm Gemma actually describes the image.

## 7. Architecture
```
Browser (Next.js)  --multipart-->  FastAPI /api/analyze
                                      |-- EXTRACT  (Gemma 4 vision)
                                      |-- VERIFY   (check_domain, Tavily)  [Agents SDK, tool fallback = direct calls]
                                      '-- VERDICT  (Gemma 4)
                  <--JSON------------'
```

## 8. API contract (frontend can build against this mock today)
`POST /api/analyze` — multipart fields: `image` (optional), `text` (optional), `question` (optional), `web_check` (bool, optional).
`GET /api/health` -> `{"ok": true, "mode": "local|hosted", "model": "..."}`

Response:
```json
{
  "verdict": "scam",
  "red_flags": ["asks_otp_pin_cnic_card", "urgency_threat", "impersonates_bank_telco_govt"],
  "explanation_ur": "یہ پیغام آپ سے کوڈ مانگ رہا ہے اور جلدی کرنے کا کہہ رہا ہے۔ اصلی بینک ایسا نہیں کرتا۔",
  "what_to_do_ur": "کوڈ کسی کو نہ بتائیں۔ اپنے کارڈ پر لکھے نمبر پر خود بینک کو فون کریں۔",
  "family_warning_ur": "⚠️ ہوشیار! ایک جعلی پیغام گھوم رہا ہے جو کوڈ مانگتا ہے۔ کسی کو کوڈ یا پن مت بتائیں۔",
  "extracted": {"links": ["http://example-bank-login.test"], "phones": [], "claimed_sender": "Bank", "asks_for": ["OTP"], "urgency": true},
  "evidence": [{"claim": "link is not an official domain", "source": "local_allowlist", "detail": "no match"}],
  "mode": "local",
  "latency_ms": 4200
}
```
`verdict` is one of `safe | suspicious | scam`. On any model/JSON failure: retry once, then return `suspicious` with an Urdu "could not check, ask a family member" message. Never return `safe` on failure.

## 9. Branding (follows the Conclave AI system, about 90%)
Source of truth: the Conclave AI v3 change spec. Keep its palette, fonts, flat-colour rules, floating pill nav and 7x7 stud-grid marks.
Hifazat adds only two things: Urdu fonts, and verdict colors (green / orange / red).
Name: **Hifazat / حفاظت**. Logo: `docs/brand/logo.svg`, a shield drawn on the Conclave 7x7 stud grid with a lime check.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0B1512` | Text on light, dark surfaces |
| `--chalk` | `#F1F4EC` | Page background (light) |
| `--forest` | `#14302A` | Header, dark cards, logo tile |
| `--mist` | `#8FA39A` | Muted borders and decoration. Not for body text on chalk (fails AA) |
| `--lime` | `#C8F169` | Primary action fill. Always ink text on top |
| `--lime-deep` | `#5E8A00` | Lime-coloured text or icons on light backgrounds |
| `--violet` | `#7C5CFF` | Anything live or speaking: analyzing state, read-aloud playing |
| `--safe` / `--warn` / `--danger` | `#1F9D55` / `#F77F00` / `#D62828` | Verdict colors (Hifazat additions). Red is reserved for the scam alert |

Rules inherited from Conclave AI (do not break):
- Flat colour only: no gradients, glassmorphism, blobs or heavy shadows.
- Lime marks actions, violet marks anything live or speaking. One primary action per section.
- Every visual explains something. WCAG AA on all text. `prefers-reduced-motion` gets a static version of every animation.
- Never show a number, logo, quote or result that is not real. Mock-ups are labelled "Example".

Fonts (load with `next/font/google`): **Syne** headings and brand, **Outfit** Latin body, **IBM Plex Mono** for chips, flags and evidence.
Urdu: **Noto Nastaliq Urdu** for headings, **Noto Naskh Arabic** for body (more readable at length).
Elder-friendly sizes: body at least 22px, buttons at least 64px tall, generous line height for Nastaliq, RTL layout.

Layout: floating pill nav (logo, "Check a message", "How it works"), one page: hero with a huge drop zone and Ctrl+V hint, result card, how-it-works strip.
Stud motifs: Hifazat shield for the logo and favicon; a single violet stud pulsing for loading; stud "Gate" glyph (door pattern) beside "ask a family member"; ruled-line "Ledger" pattern as the header of the evidence list.

`frontend/app/globals.css` starter:
```css
:root {
  --ink:#0B1512; --chalk:#F1F4EC; --forest:#14302A; --mist:#8FA39A;
  --lime:#C8F169; --lime-deep:#5E8A00; --violet:#7C5CFF;
  --safe:#1F9D55; --warn:#F77F00; --danger:#D62828;
}
body { background:var(--chalk); color:var(--ink); font-size:22px; }
.btn-primary { background:var(--lime); color:var(--ink); min-height:64px; border-radius:999px; font-weight:700; }
.live { color:var(--violet); }
```

## 10. Folder structure (Phase 1)
```
hifazat/
├─ AGENTS.md  CLAUDE.md  README.md  LICENSE  .env.example  .gitignore
├─ docs/prd/PRD.md
├─ docs/brand/logo.svg
├─ backend/
│  ├─ app/{main.py, config.py, schemas.py, llm.py, pipeline.py, prompts.py}
│  ├─ app/tools/{domain_check.py, web_search.py}
│  ├─ data/official_domains.json
│  ├─ scripts/smoke_test.py
│  ├─ tests/
│  └─ requirements.txt   # fastapi uvicorn openai openai-agents pydantic python-multipart pillow tavily-python python-dotenv
├─ frontend/             # create-next-app (TypeScript, Tailwind, App Router)
│  ├─ app/{layout.tsx, page.tsx, globals.css}
│  ├─ components/{Uploader, VerdictCard, ScamAlert, FamilyWarning, SpeakButton}.tsx
│  └─ lib/api.ts
└─ samples/{scam_sms.png, whatsapp.png, safe_message.png}
```
Windows (PowerShell), from repo root:
```
mkdir backend\app\tools, backend\data, backend\scripts, backend\tests, docs\prd, docs\brand, samples
npx create-next-app@latest frontend --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*"
```
`data/official_domains.json`: small, hand-verified list of official bank/telecom/wallet/government domains. Verify each entry on the organization's own site before adding. Do not guess.

## 11. Phases, owners, exit tests (clock times for Sat 24 Oct)
| Phase | Owner | Window | Exit test |
|---|---|---|---|
| **1. Scaffold** | Person B | now → 2:05 | Repo public, MIT, README names Gemma 4, folders pushed, Next.js and FastAPI both start, mock `/api/analyze` returns the section 8 JSON |
| **2. Core AI** | Person A | now → 2:25 | `smoke_test.py` shows Gemma describing the image in Urdu with latency; real `/api/analyze` returns valid JSON for the scam sample |
| **3. UI wiring** | Person B | 2:05 → 2:30 | Paste/upload -> verdict card; scam sample shows full-screen red alert; family copy button works |
| **4. Verify + voice** | A: 2:25–2:40 (Tavily + domain check). B: 2:30–2:40 (TTS) | | Evidence list renders; TTS button hidden or working |
| **5. Ship** | Both | 2:40 → 2:55 | 5 samples tested (incl. one genuinely safe), backup demo video, README final, submitted on MLH with every challenge ticked, repo opens in incognito |
STT and the "how do I" tab are stretch: start only if Phase 4 is green before 2:40 (probably cut).

## 12. Definition of done
- [ ] All 4 must-haves true (repo public, MIT, Gemma 4 named in README, submitted before the deadline)
- [ ] Smoke test passes; scam sample gives `scam`, a normal message gives `safe`
- [ ] Failure path never says `safe`
- [ ] Red alert full-screen with big dismiss button
- [ ] No secrets committed (`.env` in `.gitignore`)
- [ ] 60–90 s backup demo video recorded

## 13. Demo script (90 s)
1. "Parents get messages like this." Paste the fake bank SMS screenshot.
2. Hifazat shows a red full-screen alert in Urdu, the matched red flags, and evidence.
3. Tap "Forward to family" and paste the warning into a WhatsApp group.
4. Paste a normal message: green "looks safe" (it does not cry wolf).
5. "Gemma 4 did all of this. Local mode: your screenshot never leaves your device."

## 14. Risks and fallbacks
| Risk | Fallback |
|---|---|
| Image ignored by Ollama on Windows | Split GGUF + mmproj import; else hosted Gemma 4 via env switch |
| Too slow on CPU | `gemma4:e2b`, smaller image (long edge ≤ 1024 px), or hosted mode |
| Urdu quality weak | Shorter prompts, simpler sentence instruction, few-shot Urdu examples in `prompts.py` |
| Gemma tool-calling flaky in Agents SDK | Call `check_domain` / `web_search` directly in code |
| Next.js not rendering by 2:15 | Static `index.html` served by FastAPI, same API contract |
| Wi-Fi fails at demo | Local mode + recorded video |
| Challenge rule about "built during event" | Fresh repo, all commits dated today |

## 15. Considered and deferred
Supabase (no data to store), user accounts, history, Web Speech STT (cloud audio), cloud TTS, deployment, WhatsApp bot integration.

## 16. Open questions
- Which MLH challenges must be ticked on submission?
- Does any challenge require local-only inference?
- Team size confirmed as 2; names to add to README.
