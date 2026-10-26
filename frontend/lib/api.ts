// API client for the Hifazat backend. Contract: docs/prd/PRD.md section 8.
// This is the only file that knows the API URL.

export type Verdict = "safe" | "suspicious" | "scam";

export type RedFlag =
  | "asks_otp_pin_cnic_card"
  | "urgency_threat"
  | "unexpected_prize_or_aid"
  | "return_money_by_mistake"
  | "impersonates_bank_telco_govt"
  | "unofficial_link"
  | "asks_to_install_app";

export interface Extracted {
  links: string[];
  phones: string[];
  claimed_sender: string | null;
  asks_for: string[];
  urgency: boolean;
}

export interface Evidence {
  claim: string;
  source: string;
  detail: string;
}

export interface AnalyzeResult {
  verdict: Verdict;
  red_flags: RedFlag[];
  explanation_ur: string;
  what_to_do_ur: string;
  family_warning_ur: string;
  extracted: Extracted;
  evidence: Evidence[];
  mode: "local" | "hosted";
  latency_ms: number;
}

export interface Checks {
  safe_browsing: boolean;
  web_search: boolean;
  agents: boolean;
  listener: boolean;
}

export interface Health {
  ok: boolean;
  mode: "local" | "hosted";
  model: string;
  checks?: Checks;
}

export type Lang = "en" | "ur";

export interface AnalyzeInput {
  lang?: Lang;
  image?: File | null;
  text?: string;
  question?: string;
  webCheck?: boolean;
}

export type ApiErrorKind = "network" | "backend_down" | "timeout" | "server";

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message?: string) {
    super(message ?? kind);
    this.name = "ApiError";
  }
}

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const TIMEOUT_MS = 180_000; // hosted Gemma 4 thinks first and can take a minute or two

// ---------- Mock results (example data, used in mock mode and by demo keys D+1/2/3) ----------

const MOCK_RESULTS_UR: Record<Verdict, AnalyzeResult> = {
  scam: {
    verdict: "scam",
    red_flags: ["asks_otp_pin_cnic_card", "urgency_threat", "impersonates_bank_telco_govt", "unofficial_link"],
    explanation_ur:
      "یہ پیغام آپ سے کوڈ مانگ رہا ہے اور جلدی کرنے کا کہہ رہا ہے۔ اصلی بینک ایسا نہیں کرتا۔",
    what_to_do_ur: "کوڈ کسی کو نہ بتائیں۔ اپنے کارڈ پر لکھے نمبر پر خود بینک کو فون کریں۔",
    family_warning_ur:
      "⚠️ ہوشیار! ایک جعلی پیغام گھوم رہا ہے جو کوڈ مانگتا ہے۔ کسی کو کوڈ یا پن مت بتائیں۔",
    extracted: {
      links: ["http://example-bank-login.test"],
      phones: [],
      claimed_sender: "Bank",
      asks_for: ["OTP"],
      urgency: true,
    },
    evidence: [{ claim: "link is not an official domain", source: "local_allowlist", detail: "no match" }],
    mode: "local",
    latency_ms: 4200,
  },
  suspicious: {
    verdict: "suspicious",
    red_flags: ["unexpected_prize_or_aid"],
    explanation_ur:
      "یہ پیغام انعام کا وعدہ کر رہا ہے لیکن یہ واضح نہیں کہ کس نے بھیجا ہے۔ ایسے پیغام اکثر دھوکا ہوتے ہیں۔",
    what_to_do_ur: "کسی لنک پر کلک نہ کریں۔ پہلے گھر والوں سے پوچھیں۔",
    family_warning_ur:
      "⚠️ ایک انعام والا پیغام آیا ہے جو مشکوک لگتا ہے۔ کسی لنک پر کلک نہ کریں اور کوئی معلومات نہ دیں۔",
    extracted: { links: [], phones: ["03001234567"], claimed_sender: null, asks_for: [], urgency: false },
    evidence: [],
    mode: "local",
    latency_ms: 3900,
  },
  safe: {
    verdict: "safe",
    red_flags: [],
    explanation_ur: "یہ ایک عام پیغام لگتا ہے۔ اس میں کوڈ، پیسے یا لنک نہیں مانگا گیا۔",
    what_to_do_ur: "پھر بھی، اگر کوئی کوڈ یا پیسے مانگے تو رک جائیں اور گھر والوں سے پوچھیں۔",
    family_warning_ur: "یہ پیغام عام لگتا ہے، لیکن کوڈ یا پن کبھی کسی کو نہ بتائیں۔",
    extracted: { links: [], phones: [], claimed_sender: null, asks_for: [], urgency: false },
    evidence: [],
    mode: "local",
    latency_ms: 3100,
  },
};

const MOCK_RESULTS_EN: Record<Verdict, AnalyzeResult> = {
  scam: {
    ...MOCK_RESULTS_UR.scam,
    explanation_ur: "This message asks for your code and tells you to hurry. A real bank never does that.",
    what_to_do_ur: "Don't share the code with anyone. Call your bank yourself, on the number printed on your card.",
    family_warning_ur: "⚠️ Careful! A fake message is going around that asks for your code. Never share a code or PIN.",
  },
  suspicious: {
    ...MOCK_RESULTS_UR.suspicious,
    explanation_ur: "This message promises a prize, but it isn't clear who sent it. Messages like this are usually scams.",
    what_to_do_ur: "Don't tap any link. Ask someone you trust first.",
    family_warning_ur: "⚠️ A prize message arrived that looks suspicious. Don't tap any link or share any details.",
  },
  safe: {
    ...MOCK_RESULTS_UR.safe,
    explanation_ur: "This looks like an ordinary message. It doesn't ask for a code, money or a link.",
    what_to_do_ur: "Still, if anyone asks for a code or money, stop and ask someone you trust.",
    family_warning_ur: "This message looks ordinary, but never share a code or PIN with anyone.",
  },
};

export function getMockResult(verdict: Verdict, lang: Lang): AnalyzeResult {
  return (lang === "en" ? MOCK_RESULTS_EN : MOCK_RESULTS_UR)[verdict];
}

const SCAM_HINT = /otp|pin|code|cnic|کوڈ|پن|شناختی|انعام|prize|block|بند|فوری|urgent|install/i;

function mockVerdict(input: AnalyzeInput): Verdict {
  const text = `${input.text ?? ""} ${input.question ?? ""}`;
  if (input.image || SCAM_HINT.test(text)) return "scam";
  if (/https?:\/\/|www\./i.test(text)) return "suspicious";
  return "safe";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Real API ----------

const VERDICTS: Verdict[] = ["safe", "suspicious", "scam"];

// Never trust shape blindly: an unknown verdict becomes "suspicious", never "safe".
const FALLBACK_TEXT: Record<Lang, { explanation: string; action: string }> = {
  ur: {
    explanation: "ہم یہ پیغام پوری طرح چیک نہیں کر سکے۔ اسے مشکوک سمجھیں۔",
    action: "کوئی کوڈ یا پیسے نہ دیں اور گھر والوں سے پوچھیں۔",
  },
  en: {
    explanation: "We couldn't fully check this message. Treat it as suspicious.",
    action: "Don't share any code or money, and ask someone you trust.",
  },
};

function normalize(raw: Partial<AnalyzeResult>, lang: Lang): AnalyzeResult {
  return {
    verdict: VERDICTS.includes(raw.verdict as Verdict) ? (raw.verdict as Verdict) : "suspicious",
    red_flags: Array.isArray(raw.red_flags) ? raw.red_flags : [],
    explanation_ur: raw.explanation_ur || FALLBACK_TEXT[lang].explanation,
    what_to_do_ur: raw.what_to_do_ur || FALLBACK_TEXT[lang].action,
    family_warning_ur: raw.family_warning_ur ?? "",
    extracted: raw.extracted ?? { links: [], phones: [], claimed_sender: null, asks_for: [], urgency: false },
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    mode: raw.mode === "hosted" ? "hosted" : "local",
    latency_ms: typeof raw.latency_ms === "number" ? raw.latency_ms : 0,
  };
}

async function request(path: string, init: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) throw new ApiError("server", `HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") throw new ApiError("timeout");
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new ApiError(offline ? "network" : "backend_down");
  } finally {
    clearTimeout(timer);
  }
}

export async function getHealth(): Promise<Health> {
  if (USE_MOCK) {
    return { ok: true, mode: "local", model: "gemma4:e4b (mock)", checks: { safe_browsing: false, web_search: false, agents: false, listener: false } };
  }
  const res = await request("/api/health", { method: "GET" }, 5_000);
  return (await res.json()) as Health;
}

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
  if (USE_MOCK) {
    await sleep(1500);
    return getMockResult(mockVerdict(input), input.lang ?? "ur");
  }
  const form = new FormData();
  if (input.image) form.append("image", input.image);
  if (input.text?.trim()) form.append("text", input.text.trim());
  if (input.question?.trim()) form.append("question", input.question.trim());
  form.append("lang", input.lang ?? "ur");
  if (input.webCheck !== undefined) form.append("web_check", String(input.webCheck));
  const res = await request("/api/analyze", { method: "POST", body: form });
  try {
    return normalize((await res.json()) as Partial<AnalyzeResult>, input.lang ?? "ur");
  } catch {
    throw new ApiError("server", "invalid JSON");
  }
}
