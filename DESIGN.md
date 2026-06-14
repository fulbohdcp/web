# DESIGN.md — HDCP

Refined from the working pilot. Stadium-at-night meets Panini album. Warm darks (never pure
black), one electric yellow accent, deep pitch greens. Condensed display type with athletic
energy. The figurita is the centerpiece; everything else frames it.

## Color strategy

**Committed.** Deep warm near-black surface carries the product; pitch green is the brand
field color (gradients, validated states); a single electric yellow is the accent reserved
for the score, the highlight word, and primary emphasis. Red and blue appear only as figurita
tiers, not as UI chrome.

All values OKLCH. Neutrals tinted toward green. Never `#000` / `#fff`.

| Token | OKLCH | ~Hex (pilot origin) | Use |
|---|---|---|---|
| `--bg` | `oklch(0.16 0.012 150)` | `#0a0a0a` warmed | App/page background |
| `--surface` | `oklch(0.21 0.014 152)` | `#1a1a1a` | Cards, panels |
| `--surface-2` | `oklch(0.26 0.016 152)` | `#2a2a2a` | Raised elements |
| `--ink` | `oklch(0.95 0.013 95)` | `#f5f0e8` | Primary text (warm off-white) |
| `--ink-muted` | `oklch(0.95 0.013 95 / 0.45)` | — | Secondary text |
| `--green` | `oklch(0.52 0.13 152)` | `#1a7a3c` | Brand field, gradients |
| `--green-light` | `oklch(0.64 0.15 152)` | `#25a354` | Validated, success, sliders |
| `--green-deep` | `oklch(0.38 0.10 152)` | `#0d4a1e` | Gradient ends |
| `--yellow` | `oklch(0.84 0.16 92)` | `#f5c518` | THE accent: score, highlight, CTA glow |
| `--red` | `oklch(0.62 0.20 25)` | `#e63946` | Figurita tier only |
| `--blue` | `oklch(0.70 0.13 245)` | `#64b5f6` | Figurita tier only |

Accent discipline: yellow ≤10% of any surface. If a screen looks yellow, it's wrong.

## Typography

Three families, strict roles. Already loaded in the pilot; carry them over.

- **Bebas Neue** — display + all numbers (scores, ranking positions, the big HDCP logo).
  Tall, condensed, letter-spacing 2–6px. This is the brand's face.
- **Barlow Condensed** (600–900) — eyebrows, labels, section headings, buttons. Uppercase,
  letter-spacing 1–4px.
- **DM Sans** (300–700) — body, descriptions, form copy. The only non-condensed face; it's
  the calm against the condensed energy.

Scale jumps hard (ratio ≥1.4): tiny uppercase labels (10–13px) against huge Bebas display
(48–140px). No mid-sized filler. Body capped at 65–75ch.

## The figurita (signature component)

Vertical card, ~270px wide, heavy shadow, subtle top-light shine overlay. Four tiers by score,
each recolors the header/footer gradient and score number:

- **Verde** (medio) — green gradients, yellow score. Default.
- **Dorada** (élite, top scores) — gold gradients, white score, premium feel.
- **Azul** (corajudo) — blue accents.
- **Roja** (a trabajar) — red accents, soft pink score.

Anatomy top→bottom: header (brand mark + season / big score number + label), photo zone (glow,
avatar, position pill, age pill), name area (Bebas name, position title/apodo, italic one-liner),
3-stat strip, footer (id + age-range + country). Verified badge when ≥5 validations.

## Motion

- Onboarding: one question per screen, slide + fade between steps (transform/opacity only),
  ease-out-expo, ~280ms. Progress bar fills.
- Figurita reveal: rise + slight scale on first paint, the score number counts up.
- Hover/press: subtle lift, no bounce, no elastic.
- Respect `prefers-reduced-motion`.

## Texture

Stadium atmosphere, used sparingly: faint scanlines (opacity ~0.025), radial green glow at the
bottom of hero/cover, slow zoom on photographic backgrounds. Glassmorphism only on the cover
pill, never as a default card treatment.

## Bans (project-specific, on top of the shared laws)

- No side-stripe colored borders (the pilot used `border-left` accents — replace with full
  borders, tints, or leading numbers).
- No gradient text. Highlight words use solid `--yellow`, emphasis via weight/size.
- No pure black/white anywhere.
- No gamer-RGB / neon-on-black. Greens and yellow stay warm and editorial.
