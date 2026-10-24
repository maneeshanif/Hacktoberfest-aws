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

export interface Health {
  ok: boolean;
  mode: "local" | "hosted";
  model: string;
}

export interface AnalyzeInput {
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
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
export const TIMEOUT_MS = 60_000;

// ---------- Mock results (example data, used in mock mode and by demo keys D+1/2/3) ----------

export const MOCK_RESULTS: Record<Verdict, AnalyzeResult> = {
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
function normalize(raw: Partial<AnalyzeResult>): AnalyzeResult {
  return {
    verdict: VERDICTS.includes(raw.verdict as Verdict) ? (raw.verdict as Verdict) : "suspicious",
    red_flags: Array.isArray(raw.red_flags) ? raw.red_flags : [],
    explanation_ur: raw.explanation_ur ?? "ہم یہ پیغام پوری طرح چیک نہیں کر سکے۔ اسے مشکوک سمجھیں۔",
    what_to_do_ur: raw.what_to_do_ur ?? "کوئی کوڈ یا پیسے نہ دیں اور گھر والوں سے پوچھیں۔",
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
  if (USE_MOCK) return { ok: true, mode: "local", model: "gemma4:e4b (mock)" };
  const res = await request("/api/health", { method: "GET" }, 5_000);
  return (await res.json()) as Health;
}

export async function analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
  if (USE_MOCK) {
    await sleep(1500);
    return MOCK_RESULTS[mockVerdict(input)];
  }
  const form = new FormData();
  if (input.image) form.append("image", input.image);
  if (input.text?.trim()) form.append("text", input.text.trim());
  if (input.question?.trim()) form.append("question", input.question.trim());
  if (input.webCheck !== undefined) form.append("web_check", String(input.webCheck));
  const res = await request("/api/analyze", { method: "POST", body: form });
  try {
    return normalize((await res.json()) as Partial<AnalyzeResult>);
  } catch {
    throw new ApiError("server", "invalid JSON");
  }
}
