# Aurea Terra Joyas — Landing Sections Implementation Plan

**Goal:** Build the four sections after the hero (Details, Collection, HowToBuy, Contact+Footer) using the existing design tokens and Angular 21 setup. No new dependencies.

**Architecture:** Five standalone components total: a shared `ScrollRevealDirective` plus four section components under `src/app/sections/`. `app.html` composes them vertically after `<app-hero />`. Animations driven by IntersectionObserver toggling a single class.

**Tech Stack:** Angular 21 · CSS custom properties · IntersectionObserver · SVG inline · No GSAP, no Tailwind, no images.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/styles.css` | Add section tokens + global `[scrollReveal]` rules |
| Create | `src/app/shared/scroll-reveal.directive.ts` | One-shot IntersectionObserver directive |
| Create | `src/app/sections/details/details.component.{ts,html,css}` | Narrative section |
| Create | `src/app/sections/collection/collection.component.{ts,html,css}` | Horizontal scroll carousel + WhatsApp CTAs |
| Create | `src/app/sections/how-to-buy/how-to-buy.component.{ts,html,css}` | 4-step grid |
| Create | `src/app/sections/contact/contact.component.{ts,html,css}` | Contact CTAs + footer |
| Modify | `src/app/app.ts` | Import + register new components |
| Modify | `src/app/app.html` | Render hero + 4 new sections |

---

## Task 1: Tokens + ScrollRevealDirective

- [ ] **Step 1**: Add to `src/styles.css` `:root`:
  - `--section-padding-y: clamp(64px, 12vw, 120px);`
  - `--section-padding-x: clamp(20px, 5vw, 48px);`
  - `--container-max: 1200px;`
- [ ] **Step 2**: Add global rule for `[scrollReveal]` (opacity 0 + translateY 16px transitioning to visible).
- [ ] **Step 3**: Add `prefers-reduced-motion` override for `[scrollReveal]`.
- [ ] **Step 4**: Create `src/app/shared/scroll-reveal.directive.ts`:
  - Standalone directive, selector `[scrollReveal]`
  - In `ngAfterViewInit`: check reduced motion → set class immediately; else create observer with `threshold: 0.15`, `rootMargin: '0px 0px -10% 0px'`, on intersect add class and disconnect
  - In `ngOnDestroy`: disconnect observer
- [ ] **Step 5**: Run `npm run build` to verify no compile errors.

## Task 2: Details Section

- [ ] **Step 1**: Create folder + component files.
- [ ] **Step 2**: Template: eyebrow + H2 + paragraph in left column; decorative gradient block with inline SVG (sun + 3 stars) in right column. Both columns wrapped in container with `scrollReveal` on the section.
- [ ] **Step 3**: CSS: 2-column grid `1fr` on mobile, `3fr 2fr` on `min-width: 768px`; stagger via `transition-delay` on children when section becomes `.is-visible`.
- [ ] **Step 4**: Verify visually with `npm start`.

## Task 3: Collection Section

- [ ] **Step 1**: Create files.
- [ ] **Step 2**: Component: hardcoded `pieces[]` array (6 items), `waLink(piece)` method building `wa.me` URL with encoded message.
- [ ] **Step 3**: Template: header + horizontal `<div class="track">` with 6 `.collection-card` children, each with category, name, CTA link.
- [ ] **Step 4**: CSS: `scroll-snap-type: x mandatory`, hidden scrollbar, card width responsive. Card-media is a gradient background with positioned inline SVG decorations (per-card class for variety). Hover on desktop: lift + media scale.
- [ ] **Step 5**: Drag-with-mouse handler: `pointerdown` → grab; `pointermove` → `scrollLeft -= dx`; `pointerup` → release. Bound only on non-touch devices via simple feature check (`pointerType === 'mouse'`).
- [ ] **Step 6**: Visual progress indicator: thin track + bar whose width = `clientWidth / scrollWidth * 100%` and whose left = `scrollLeft / scrollWidth * 100%`, updated on `scroll`.

## Task 4: HowToBuy Section

- [ ] **Step 1**: Create files.
- [ ] **Step 2**: Hardcode `steps[]` (4 items).
- [ ] **Step 3**: Template: header + grid of 4 cards (number, title, desc).
- [ ] **Step 4**: CSS: 1/2/4 column responsive grid; stagger via `transition-delay: calc(var(--i, 0) * 80ms)` with `--i` set via `[style.--i]="$index"` in template.

## Task 5: Contact + Footer

- [ ] **Step 1**: Create files (one component handles both Contact and Footer markup).
- [ ] **Step 2**: Template:
  - `<section class="contact">` with cobalt background, centered H2 + 3 CTA links (WhatsApp/Instagram/Email).
  - `<footer class="footer">` with ink background, brand left + legals right.
- [ ] **Step 3**: Inline SVG icons (24×24) for each CTA — single-stroke style matching hero-sun.
- [ ] **Step 4**: Hover state on pill CTAs: inverted colors.

## Task 6: Wire Up + Verify

- [ ] **Step 1**: Update `src/app/app.ts` imports: add `DetailsComponent`, `CollectionComponent`, `HowToBuyComponent`, `ContactComponent`. Add them to `imports` array.
- [ ] **Step 2**: Update `src/app/app.html` to render `<app-hero />`, then the 4 new components in order.
- [ ] **Step 3**: Run `npm run build` to verify no errors.
- [ ] **Step 4**: Run `npm test` to verify existing hero tests still pass.
- [ ] **Step 5**: Commit.

---

## Self-Review Checklist

- [ ] Each section uses `scrollReveal` directive
- [ ] All sections use existing design tokens (no hardcoded colors except gradients)
- [ ] Mobile-first: every section works at 320px wide
- [ ] `prefers-reduced-motion` respected globally via directive's logic + CSS override
- [ ] No new npm dependencies
- [ ] WhatsApp/Instagram/Email links open in new tab with `rel="noopener"`
- [ ] All CTAs have accessible `aria-label`s
