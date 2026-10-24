import type { RedFlag } from "./api";

export const FLAG_LABELS_UR: Record<RedFlag, string> = {
  asks_otp_pin_cnic_card: "کوڈ، پن یا شناختی کارڈ مانگتا ہے",
  urgency_threat: "جلدی یا دھمکی",
  unexpected_prize_or_aid: "اچانک انعام یا امداد",
  return_money_by_mistake: "غلطی سے پیسے بھیجنے کا بہانہ",
  impersonates_bank_telco_govt: "بینک، کمپنی یا حکومت بن کر",
  unofficial_link: "غیر سرکاری لنک",
  asks_to_install_app: "ایپ انسٹال کرواتا ہے",
};

export function flagLabel(flag: string): string {
  return FLAG_LABELS_UR[flag as RedFlag] ?? flag;
}
