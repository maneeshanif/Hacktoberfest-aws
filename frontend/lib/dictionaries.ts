// All user-facing copy lives here as plain data (safe to import from server and client code).
// English is the source of truth for the shape; to add a language, add a Locale, a dictionary of type Strings,
// and an entry in DICTIONARIES.

import type { ApiErrorKind, RedFlag, Verdict } from "./api";

export type Locale = "en" | "ur";

const en = {
  switchTo: "اردو",
  switchToLabel: "Switch to Urdu",
  meta: {
    title: "Hifazat | Check a suspicious message before you tap",
    description:
      "Paste a screenshot or the text of a message and get a plain-language verdict: safe, suspicious or scam. A private AI scam shield, powered by Gemma 4.",
  },
  nav: { label: "Main", howItWorks: "How it works", catches: "What we catch", faq: "FAQ", cta: "Check a message" },
  hero: {
    title: "Strange message? Check it before you tap.",
    sub: "Paste a screenshot or the text. Hifazat tells you in plain words whether it looks like a scam, and what to do next.",
    primary: "Check a message",
    secondary: "See how it works",
    points: ["Free to use", "No account needed", "Never says “guaranteed safe”"],
  },
  checker: {
    title: "Message checker",
    private: "Private: your image stays on this computer",
    loading: "Checking the message…",
    errorTitle: "That didn't work",
    errorAdvice: "Until it's checked, treat the message as suspicious. Don't share codes or send money.",
    retry: "Try again",
    another: "Check another message",
    errors: {
      network: "Your internet connection looks off. Check it and try again.",
      backend_down: "The checker isn't running right now. Try again in a little while.",
      timeout: "The check took too long. Try again.",
      server: "This message couldn't be checked just now. Try again.",
    } satisfies Record<ApiErrorKind, string>,
  },
  uploader: {
    placeholder: "Paste the message here, or press Ctrl+V to paste a screenshot…",
    textLabel: "Message text",
    pickImage: "Choose image",
    paste: "Paste",
    pasteHint: "Press Ctrl+V anywhere on the page, drag an image in, or tap Speak and say what the message said.",
    removeImage: "Remove image",
    imageAlt: "The image you added",
    questionLabel: "Your question (optional)",
    questionPlaceholder: "Your question (optional), e.g. “Is it safe to open this link?”",
    submit: "Check message",
    pasteDenied: "Couldn't read the clipboard. Press Ctrl+V instead.",
    badType: "Please add an image (PNG, JPG or WEBP).",
    tooBig: "That image is too large. Use one under 8 MB.",
  },
  verdict: {
    titles: { safe: "Looks okay", suspicious: "Looks suspicious", scam: "Likely a scam" } satisfies Record<Verdict, string>,
    example: "Example",
    whatToDo: "What to do now",
    flags: "Warning signs",
    evidence: "Evidence",
    disclaimer: "This is a second opinion, not a final answer. If in doubt, ask someone you trust.",
  },
  family: { send: "Warn my family", copied: "Copied ✓", whatsapp: "Send on WhatsApp" },
  speak: { start: "Listen", stop: "Stop" },
  voice: {
    start: "Speak",
    stop: "Stop",
    listening: "Listening… say what the message said.",
    privacy: "Voice typing uses your browser's speech service, so your audio may be processed by the browser maker.",
    denied: "Microphone access is blocked. Allow it in your browser's site settings and try again.",
    noSpeech: "Didn't hear anything. Try again, closer to the microphone.",
    failed: "Voice typing didn't work. You can type or paste instead.",
  },
  alert: {
    title: "This looks like a scam. Don't share any code or PIN.",
    dismiss: "I understand",
    listen: "Listen",
  },
  flagLabels: {
    asks_otp_pin_cnic_card: "Asks for a code, PIN or ID number",
    urgency_threat: "Rushes or threatens you",
    unexpected_prize_or_aid: "Unexpected prize or aid",
    return_money_by_mistake: "“Sent money by mistake”",
    impersonates_bank_telco_govt: "Pretends to be a bank, telecom or government",
    unofficial_link: "Unofficial link",
    asks_to_install_app: "Asks you to install an app",
  } satisfies Record<RedFlag, string>,
  flagHelp: {
    asks_otp_pin_cnic_card: "Real banks never ask for your OTP, PIN or card details by message or call.",
    urgency_threat: "“Account blocked in 1 hour” is designed to stop you from thinking.",
    unexpected_prize_or_aid: "Lucky draws and aid payouts you never signed up for are bait.",
    return_money_by_mistake: "A fake payment alert, then a request to send the money back.",
    impersonates_bank_telco_govt: "Familiar names and logos are easy to copy. The sender isn't.",
    unofficial_link: "Look-alike or shortened links that lead to fake login pages.",
    asks_to_install_app: "Remote-access apps give a stranger control of your phone.",
  } satisfies Record<RedFlag, string>,
  catches: { title: "What Hifazat looks for", sub: "Seven warning signs behind most scam messages." },
  how: {
    title: "Three steps, about ten seconds",
    steps: [
      { title: "Paste it", body: "Add a screenshot or the message text. Ask a question too if you have one." },
      { title: "Get a verdict", body: "Safe, suspicious or scam, with the warning signs it found and any link checks." },
      { title: "Know what to do", body: "One clear next step, plus a ready-made warning to send to your family." },
    ],
  },
  privacy: {
    title: "Your messages stay yours",
    body: "By default Hifazat runs the Gemma 4 model on your own computer, so your screenshots aren't sent to a cloud service. There are no accounts and no history.",
  },
  faq: {
    title: "Questions",
    items: [
      {
        q: "Can Hifazat guarantee a message is safe?",
        a: "No. It gives a second opinion, and it will never call a message “guaranteed safe”. If it can't check something, it says suspicious.",
      },
      { q: "Do I need an account?", a: "No. Open the page, paste a message and read the verdict. Nothing is saved." },
      {
        q: "What happens if the checker is down?",
        a: "You'll see a note telling you to treat the message as suspicious. It never shows “safe” by default.",
      },
      {
        q: "Is voice typing private?",
        a: "Voice typing is optional and uses your browser's built-in speech recognition. In Chrome and Edge that audio can be processed by the browser maker's servers. For a fully on-device check, type, paste or add a screenshot instead.",
      },
      {
        q: "Which languages does it support?",
        a: "The page and the explanations come in English and Urdu. Use the language switch at the top.",
      },
    ],
  },
  footer: { line: "Hifazat · Powered by Gemma 4", note: "A second opinion, never a guarantee." },
};

export type Strings = typeof en;

const ur: Strings = {
  switchTo: "English",
  switchToLabel: "انگریزی میں دیکھیں",
  meta: {
    title: "حفاظت | مشکوک پیغام؟ پہلے یہاں چیک کریں",
    description: "مشکوک پیغام؟ پہلے یہاں چیک کریں۔ ایک نجی AI حفاظتی نظام، Gemma 4 کے ساتھ۔",
  },
  nav: { label: "مرکزی", howItWorks: "کیسے کام کرتا ہے", catches: "ہم کیا پکڑتے ہیں", faq: "سوالات", cta: "پیغام چیک کریں" },
  hero: {
    title: "مشکوک پیغام؟ پہلے یہاں چیک کریں",
    sub: "اسکرین شاٹ یا پیغام لگائیں۔ ہم آسان اردو میں بتائیں گے کہ یہ دھوکا تو نہیں۔",
    primary: "پیغام چیک کریں",
    secondary: "کیسے کام کرتا ہے",
    points: ["مفت", "اکاؤنٹ کی ضرورت نہیں", "کبھی “یقینی محفوظ” نہیں کہتا"],
  },
  checker: {
    title: "پیغام چیک کرنے والا",
    private: "نجی: آپ کی تصویر آپ کے کمپیوٹر پر ہی رہتی ہے",
    loading: "سوچ رہا ہوں…",
    errorTitle: "معاف کیجیے",
    errorAdvice: "جب تک چیک نہ ہو، اس پیغام کو مشکوک سمجھیں اور کسی کو کوڈ یا پیسے نہ دیں۔",
    retry: "دوبارہ کوشش کریں",
    another: "نیا پیغام چیک کریں",
    errors: {
      network: "انٹرنیٹ کا مسئلہ لگتا ہے۔ کنکشن چیک کر کے دوبارہ کوشش کریں۔",
      backend_down: "چیک کرنے والا نظام ابھی چل نہیں رہا۔ تھوڑی دیر بعد دوبارہ کوشش کریں۔",
      timeout: "جواب آنے میں بہت دیر ہو گئی۔ دوبارہ کوشش کریں۔",
      server: "ابھی یہ پیغام چیک نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
    },
  },
  uploader: {
    placeholder: "پیغام یہاں لگائیں، یا اسکرین شاٹ Ctrl+V سے لگائیں…",
    textLabel: "پیغام کا متن",
    pickImage: "تصویر چنیں",
    paste: "پیسٹ",
    pasteHint: "صفحے پر کہیں بھی Ctrl+V دبائیں، تصویر کھینچ کر لائیں، یا بول کر لکھیں پر ٹیپ کر کے پیغام بولیں۔",
    removeImage: "تصویر ہٹائیں",
    imageAlt: "آپ کی لگائی ہوئی تصویر",
    questionLabel: "آپ کا سوال (اختیاری)",
    questionPlaceholder: "آپ کا سوال (اختیاری)، مثلاً: کیا میں یہ لنک کھول لوں؟",
    submit: "چیک کریں",
    pasteDenied: "پیسٹ کی اجازت نہیں ملی۔ Ctrl+V دبائیں۔",
    badType: "صرف تصویر لگائیں (PNG، JPG یا WEBP)۔",
    tooBig: "یہ تصویر بہت بڑی ہے۔ 8 MB سے چھوٹی تصویر لگائیں۔",
  },
  verdict: {
    titles: { safe: "ٹھیک لگتا ہے", suspicious: "مشکوک ہے", scam: "دھوکا ہو سکتا ہے" },
    example: "نمونہ",
    whatToDo: "اب کیا کریں",
    flags: "خطرے کی نشانیاں",
    evidence: "ثبوت",
    disclaimer: "یہ دوسری رائے ہے، حتمی فیصلہ نہیں۔ شک ہو تو گھر والوں سے پوچھیں۔",
  },
  family: { send: "گھر والوں کو بھیجیں", copied: "کاپی ہو گیا ✓", whatsapp: "واٹس ایپ پر بھیجیں" },
  speak: { start: "سن لیں", stop: "روکیں" },
  voice: {
    start: "بول کر لکھیں",
    stop: "روکیں",
    listening: "سن رہا ہوں… پیغام میں جو لکھا تھا وہ بولیں۔",
    privacy: "آواز سے لکھنے کے لیے آپ کے براؤزر کی سروس استعمال ہوتی ہے، اس لیے آپ کی آواز براؤزر بنانے والی کمپنی تک جا سکتی ہے۔",
    denied: "مائیکروفون کی اجازت بند ہے۔ براؤزر کی سیٹنگ میں اجازت دے کر دوبارہ کوشش کریں۔",
    noSpeech: "کوئی آواز نہیں آئی۔ مائیکروفون کے قریب آ کر دوبارہ کوشش کریں۔",
    failed: "آواز سے لکھنا کام نہیں کیا۔ آپ ٹائپ یا پیسٹ کر سکتے ہیں۔",
  },
  alert: { title: "یہ دھوکا ہو سکتا ہے! کسی کو کوڈ یا پن مت بتائیں۔", dismiss: "سمجھ گیا", listen: "سن لیں" },
  flagLabels: {
    asks_otp_pin_cnic_card: "کوڈ، پن یا شناختی کارڈ مانگتا ہے",
    urgency_threat: "جلدی یا دھمکی",
    unexpected_prize_or_aid: "اچانک انعام یا امداد",
    return_money_by_mistake: "غلطی سے پیسے بھیجنے کا بہانہ",
    impersonates_bank_telco_govt: "بینک، کمپنی یا حکومت بن کر",
    unofficial_link: "غیر سرکاری لنک",
    asks_to_install_app: "ایپ انسٹال کرواتا ہے",
  },
  flagHelp: {
    asks_otp_pin_cnic_card: "اصلی بینک پیغام یا فون پر کبھی OTP، پن یا کارڈ کی تفصیل نہیں مانگتا۔",
    urgency_threat: "“ایک گھنٹے میں اکاؤنٹ بند” آپ کو سوچنے سے روکنے کے لیے لکھا جاتا ہے۔",
    unexpected_prize_or_aid: "جس انعام یا امداد کے لیے آپ نے درخواست نہیں دی، وہ چارہ ہوتا ہے۔",
    return_money_by_mistake: "جعلی ادائیگی کا پیغام، پھر پیسے واپس بھیجنے کی درخواست۔",
    impersonates_bank_telco_govt: "جانے پہچانے نام اور لوگو نقل ہو سکتے ہیں۔ بھیجنے والا نہیں۔",
    unofficial_link: "ملتے جلتے یا چھوٹے کیے گئے لنک جو جعلی لاگ اِن صفحے پر لے جاتے ہیں۔",
    asks_to_install_app: "ریموٹ ایپ سے اجنبی آپ کے فون کا کنٹرول لے لیتا ہے۔",
  },
  catches: { title: "حفاظت کیا دیکھتی ہے", sub: "زیادہ تر دھوکے والے پیغامات میں یہ سات نشانیاں ہوتی ہیں۔" },
  how: {
    title: "تین قدم، تقریباً دس سیکنڈ",
    steps: [
      { title: "لگائیں", body: "اسکرین شاٹ یا پیغام کا متن لگائیں۔ چاہیں تو سوال بھی پوچھیں۔" },
      { title: "فیصلہ پائیں", body: "محفوظ، مشکوک یا دھوکا، ساتھ میں ملنے والی نشانیاں اور لنک کی جانچ۔" },
      { title: "جانیں کیا کرنا ہے", body: "ایک واضح قدم، اور گھر والوں کو بھیجنے کے لیے تیار تنبیہ۔" },
    ],
  },
  privacy: {
    title: "آپ کے پیغام آپ ہی کے رہتے ہیں",
    body: "حفاظت بنیادی طور پر Gemma 4 کو آپ کے اپنے کمپیوٹر پر چلاتی ہے، اس لیے آپ کے اسکرین شاٹ کسی کلاؤڈ سروس کو نہیں بھیجے جاتے۔ نہ اکاؤنٹ، نہ ہسٹری۔",
  },
  faq: {
    title: "سوالات",
    items: [
      {
        q: "کیا حفاظت کسی پیغام کے محفوظ ہونے کی ضمانت دیتی ہے؟",
        a: "نہیں۔ یہ دوسری رائے دیتی ہے اور کسی پیغام کو کبھی “یقینی محفوظ” نہیں کہتی۔ چیک نہ ہو سکے تو مشکوک بتاتی ہے۔",
      },
      { q: "کیا اکاؤنٹ بنانا ضروری ہے؟", a: "نہیں۔ صفحہ کھولیں، پیغام لگائیں اور فیصلہ پڑھیں۔ کچھ محفوظ نہیں ہوتا۔" },
      {
        q: "اگر چیک کرنے والا نظام بند ہو تو؟",
        a: "آپ کو بتایا جائے گا کہ پیغام کو مشکوک سمجھیں۔ یہ کبھی خود بخود “محفوظ” نہیں دکھاتی۔",
      },
      {
        q: "کیا آواز سے لکھنا نجی ہے؟",
        a: "آواز سے لکھنا اختیاری ہے اور آپ کے براؤزر کی اپنی آواز پہچان استعمال کرتا ہے۔ کروم اور ایج میں یہ آواز براؤزر بنانے والی کمپنی کے سرور پر پروسیس ہو سکتی ہے۔ مکمل طور پر اپنے کمپیوٹر پر چیک کے لیے ٹائپ، پیسٹ یا اسکرین شاٹ استعمال کریں۔",
      },
      { q: "کون سی زبانیں ہیں؟", a: "صفحہ اور وضاحتیں انگریزی اور اردو میں ہیں۔ اوپر زبان کا بٹن استعمال کریں۔" },
    ],
  },
  footer: { line: "حفاظت · Gemma 4 سے چلتی ہے", note: "دوسری رائے، ضمانت نہیں۔" },
};

export const DICTIONARIES: Record<Locale, Strings> = { en, ur };
export const DEFAULT_LOCALE: Locale = "en";
