# Jardin de demain — Design system sheet

> **Status: IN PROGRESS** — This file is the design system sheet for Jardin de demain. The common method is
> [../../docs/DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md). The styles currently live in each HTML page (no `css/`
> folder yet); the next step is to extract them to a shared token-based system.

---

## 1. Current state (baseline)

Jardin de demain is a static site with guides for climate-resilient gardening. Its visual identity is calm, natural,
and approachable, with an earthy dark background and a bright lime accent color.

**Key characteristics:**
- Background: dark (`#0b0d10`), calm
- Accent: lime green (`#d6f900`), vibrant, used for the brand mark and category highlights
- Typography: serif headings (Georgia), sans-serif body (Arial/Helvetica)
- Cards: rounded corners (`border-radius: 8px`), colored left borders for category types
- Hover: shadow and border color changes (no movement)

**Current metrics** (measured from `index.html`, not yet separated into CSS files):

| Measure | Current | Target |
|---|---|---|
| CSS location | Inline `<style>` in each HTML page | Shared `css/` folder with tokens |
| Distinct hex colors | ~10 (backgrounds, text, accents) | 0 outside `:root` |
| Font sizes | Variable (clamp, px values) | 3–4 sizes via tokens |
| Border radius values | `8px`, `50%` | Tokens or 0 / 50% only |
| Color categories | 4 (`type-calendrier`, `type-guide`, `type-calculateur`, `type-prototype`) | Via `--hue` inheritance |
| Spacing values | Mixed (px, auto) | From spacing scale (4 · 8 · 12 · 16 · 24 · 32) |

**Migration status:** The CSS still lives in each page. The extraction to a shared token system follows the
common method (DESIGN-SYSTEM.md). `tools/design-lint.mjs JardinDeDemain` will measure progress once the CSS is
extracted.

---

## 2. Portfolio UX rules (L1–L4, N1)

Jardin de demain follows the portfolio-wide UX principles defined in
[../../docs/UX-PRINCIPLES.md](../../docs/UX-PRINCIPLES.md). The rules below apply to every view and are verified by
the skill `check-overlap` and manual audits.

### L1 · No overlap

**Rule:** Two blocks never cover each other. A block that must sit over another is a **layer** (L2), and then the
one below is dimmed or hidden.

**Check:** `audit-layout --strict` on every route must report `chevauchements` = 0 and `occultes` = 0.

**Application in Jardin de demain:**
- Simple layout: header, hero section, main content sections stacked vertically
- No floating elements or modals in the current design
- Cards in grids never overlap due to CSS Grid auto-placement
- Future additions (modals, panels) must dim the background and sit in a defined layer

**Zones:**
- **Header band**: top of viewport, fixed height, centered content (`.container`)
- **Hero section**: below header, full-width background, centered text
- **Main content**: sections stacked vertically, each with centered content
- **Cards grid**: auto-fit grid, minimum 340 px per card, 24 px gap

---

### L2 · One layer at a time

**Rule:** The ladder is fixed (scene < ui < float < viewer < sys < fullscreen < overlay < fx). When a layer opens
(modal, answer panel, fullscreen view), **everything floating below it yields**: hidden, or dimmed to a backdrop
with no pointer events.

**Application in Jardin de demain:**
- Current design has no layers beyond the base UI
- Future layers (if added):
  - **Base UI**: header, hero, content sections (z-index: 0 or auto)
  - **Overlay**: modals, tooltips, dropdowns (z-index: 10+, with dimmed backdrop)
- A modal opening would dim the entire page behind it with a semi-transparent overlay (no pointer events)

---

### L3 · Reserved zones, not free placement

**Rule:** Each element has a zone chosen by its expansion axis and rank (DESIGN-SYSTEM rules 11–13). Users do **not**
drag panels around to fix collisions: a collision is a layout bug, fixed in the layout.

**Application in Jardin de demain:**
- **Header**: expands horizontally, fixed at top, height auto (centered brand)
- **Hero**: expands horizontally, centered text, padding top/bottom
- **Sections**: expand vertically (stack), centered within `.container` max-width
- **Card grids**: expand both horizontally (auto-fit) and vertically (new rows), equal-width columns
- **Cards**: expand vertically to fit content, equal width within grid

No element is user-draggable. Layout is deterministic and responsive via CSS Grid and Flexbox.

---

### L4 · Harmony

**Rule:** Space is balanced: inside a bar, header or button, space above = space below and left = right (± 2 px),
from the spacing scale only (4 · 8 · 12 · 16 · 24 · 32). Equal-rank elements get equal sizes and gaps.

**Check:** `audit-layout`: `desequilibres` = 0; `design-lint` for off-scale values.

**Application in Jardin de demain:**
- **Header padding**: `24px 0` (top/bottom equal)
- **Hero padding**: `100px 20px 90px` (top ≈ bottom, side equal) — to review for exact balance
- **Card padding**: `32px` (all sides equal)
- **Gaps**: grid gap `24px`, brand gap `16px`, section margins `60px`, `100px` (multiples of scale)
- **Container margins**: `0 auto` (centered, equal left/right)

**To verify:** Ensure all spacing values are from the scale (4 · 8 · 12 · 16 · 24 · 32). Currently some values like
`20px`, `18px` are off-scale and should be adjusted.

---

### N1 · Deterministic navigation

**Rule:** Every screen state (view, open project, open panel, satellite, fold) is written in the URL and replayed
by it. Same URL ⇒ same screen. Tests and audits navigate by URL only.

**Application in Jardin de demain:**
- Current design: simple static pages, no dynamic state
- Each page is a separate HTML file with its own URL
- No in-page routing or dynamic panels yet
- Future dynamic features (filters, tabs, modals) must encode their state in URL hash or query params
- Example: `calendrier-semis.html#mois=mars` for filtering by month

**Routes to test** (future):
- `index.html` (home)
- Each guide page (11 pages total)
- Any dynamic states added later (filters, expanded sections, etc.)

---

## 3. Visual identity

**Brand color:** `#d6f900` (lime green) — used for the brand mark, eyebrows, and category highlights.

**Typography:**
- Headings: Georgia, "Times New Roman", serif — classic, calm, readable
- Body: Arial, Helvetica, sans-serif — simple, clean
- Scale: responsive via `clamp()` for headings; fixed sizes for body text

**Shapes:**
- Cards: rounded corners (`8px`)
- Brand mark: circle (`border-radius: 50%`)
- Accent bars: 4 px left border on cards

**Motion:**
- Transitions: `.2s` on hover (box-shadow, border-color)
- **No movement on hover** (follows DESIGN-SYSTEM rule: no translate, rotate, or scale)

**Category colors** (via card classes):
- Calendrier: `#d6f900` (lime)
- Guide: `#7bc96f` (green)
- Calculateur: `#64b4ff` (blue)
- Prototype: `#ffb347` (orange)

These will migrate to `--hue` variables once tokens are extracted.

---

## 4. Next steps (migration to token system)

1. **Extract styles to `css/` folder**: create `css/tokens.css`, `css/base.css`, `css/components.css`, `css/layout.css`
2. **Define color tokens in `:root`**: `--bg`, `--ink`, `--accent`, `--hue` per category
3. **Font size tokens**: normalize to 3–4 sizes (small, medium, large, display)
4. **Spacing scale**: enforce 4 · 8 · 12 · 16 · 24 · 32 throughout
5. **Component catalog**: button, card, section-header, hero, etc.
6. **Run `design-lint`**: set baseline and measure progress

---

## 5. References

- Common method: [../../docs/DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md)
- UX principles: [../../docs/UX-PRINCIPLES.md](../../docs/UX-PRINCIPLES.md)
- Model: [../../Hal/docs/design-system.md](../../Hal/docs/design-system.md)
