"""API contract (PRD section 8). Do not rename fields without telling the frontend."""
from typing import Literal

from pydantic import BaseModel, Field

Verdict = Literal["safe", "suspicious", "scam"]

RED_FLAGS = [
    "asks_otp_pin_cnic_card",
    "urgency_threat",
    "unexpected_prize_or_aid",
    "return_money_by_mistake",
    "impersonates_bank_telco_govt",
    "unofficial_link",
    "asks_to_install_app",
]


class Extracted(BaseModel):
    links: list[str] = Field(default_factory=list)
    phones: list[str] = Field(default_factory=list)
    claimed_sender: str = ""
    asks_for: list[str] = Field(default_factory=list)
    urgency: bool = False


class Evidence(BaseModel):
    claim: str
    source: str
    detail: str = ""


class Result(BaseModel):
    verdict: Verdict = "suspicious"
    red_flags: list[str] = Field(default_factory=list)
    explanation_ur: str = ""
    what_to_do_ur: str = ""
    family_warning_ur: str = ""
    extracted: Extracted = Field(default_factory=Extracted)
    evidence: list[Evidence] = Field(default_factory=list)
    mode: str = "local"
    latency_ms: int = 0


FALLBACK = Result(
    verdict="suspicious",
    red_flags=[],
    explanation_ur="ہم اس پیغام کی جانچ نہیں کر سکے۔ احتیاط کریں۔",
    what_to_do_ur="کسی کو کوڈ، پن یا پیسے نہ دیں۔ پہلے گھر کے کسی سمجھدار فرد سے پوچھ لیں۔",
    family_warning_ur="⚠️ ایک مشکوک پیغام آیا ہے۔ کسی کو کوڈ یا پن مت بتائیں اور پہلے مجھ سے پوچھ لیں۔",
)
