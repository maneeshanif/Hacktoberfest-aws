# Product

<!-- impeccable:product-schema 1 -->

<!-- Derived from docs/prd/PRD.md and AGENTS.md (not from a fresh interview). Review and correct. -->

## Platform

web

## Users
Elderly and low-literacy Urdu speakers in Pakistan who receive scam messages (fake bank SMS, OTP requests, prize/aid bait, "money sent by mistake"). Secondary: the adult child who gets "is this real?" screenshots on WhatsApp. They are anxious, often on a phone, with little time to judge a message.

## Product Purpose
Paste or upload a screenshot or text (optionally speak a question). Gemma 4 reads it and answers in large, simple Urdu or English: safe / suspicious / scam, why, and one clear thing to do now. A scam shows a full-screen red alert and a ready-to-forward warning for the family WhatsApp group.

## Positioning
A private scam shield for your parents, powered by Gemma 4, that runs on the user's own machine in local mode so the screenshot never leaves the device.

## Capabilities and Constraints
- Gemma 4 is the only model. Verdicts are never "guaranteed safe"; any failure returns `suspicious`.
- Wording is "may be a scam", never a guarantee.
- Urdu RTL is first-class; English also supported. Body text at least 22px in the checker, buttons at least 64px tall.
- Local mode shows a privacy chip; hosted mode must not claim the image stays on the device.
- No accounts, no database, no history.

## Brand Commitments
Name: Hifazat / حفاظت. Logo: a shield drawn on a 7x7 stud grid with a lime check (`docs/brand/logo.svg`). PRD section 9 (Conclave AI system, about 90%): ink / chalk / forest, lime for actions, violet for anything live or speaking, verdict colors safe / warn / danger with red reserved for scams; Syne + Outfit + IBM Plex Mono, Noto Nastaliq Urdu headings and Noto Naskh Arabic body; flat colour only (no gradients or heavy shadows); floating pill nav; reduced-motion static fallback.

## Evidence on Hand
Real verdicts from the backend only. The hero phone demo is a labelled "Example". No testimonials, user counts or accuracy claims exist and none may be invented.

## Product Principles
1. Calm authority: never alarm unless it is a scam, never cry wolf.
2. One clear next action on every screen.
3. Honest about limits: second opinion, not a guarantee.
4. Readable by an elder first: size, contrast and plain words beat decoration.
5. Private by default, and truthful about when it is not.

## Accessibility & Inclusion
WCAG AA contrast, large touch targets, RTL Urdu with generous line height, keyboard focus visible, full static fallback under prefers-reduced-motion.
