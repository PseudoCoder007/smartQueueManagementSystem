---
sketch: "002"
name: auth-pages
question: "Should auth feel like a product login or an enterprise portal?"
winner: null
tags: [auth, login, register, otp, split-screen, branding]
---

# Sketch 002: Auth Pages

## Design Question
Should the login experience project product-polish (Stripe/Clerk — clean, minimal, card-centered)
or institutional authority (split-screen branding, feature list, testimonials)?

## How to View
Open `.planning/sketches/002-auth-pages/index.html` in a browser and toggle variants with the top bar.

## Variants
- **A: Centered Card** — Logo above a white card, segmented Sign In / Register tabs, Google SSO, magic link option, trust badges below. Closest to Stripe Dashboard or Clerk. Feels like a product.
- **B: Split Screen** — Left dark panel with brand name, feature list, and testimonial; right form area on light background. Conveys institutional credibility. Good for sales-led contexts where stakeholders see the login screen.
- **C: Full-page Brand** — Large dark header spanning full width, form card floating over it, social proof strip below. Linear / Vercel aesthetic. Dramatic first impression, strong on the patient/public-facing side.

## What to Look For
1. **Brand authority vs product polish** — Does the trust panel in B convince, or does minimalism in A project more confidence?
2. **Form placement** — Card centered (A/C) vs right-side panel (B) — which is easier to locate instantly?
3. **Features list on auth** — In B, the left panel shows queue tracking / priority / analytics benefits. Is this noise at login time, or does it reinforce value for returning users?
4. **OTP / Magic Link integration** — A shows it as a text link; C shows a toggle method tab. Which is more discoverable?
5. **Social proof placement** — Testimonial in B vs institution strip in C — which is appropriate for this domain?
