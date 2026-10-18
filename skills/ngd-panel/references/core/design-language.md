# NGD design language

The default visual and interaction language for every ngd surface. It describes *how* to design: the user still decides the theme color, color mode, fonts, motion level and imagery, and their reference images override anything here. Use this as the quality bar and the source of ideas, not as a template.

## Contents
1. Precedence: whose taste wins
2. Principles
3. Typography
4. Color application
5. Layout, spacing and rhythm
6. Shape, depth and surfaces
7. Components: the details that signal quality
8. Signature details (pick one to three)
9. Mobile and touch
10. Dark mode done properly
11. Anti-patterns
12. Analysing reference images

## 1. Precedence: whose taste wins

1. The user's explicit answers (theme color, mode, personality, fonts, motion, imagery).
2. Reference images and brand guidelines the user supplied.
3. Existing brand assets, unless the user asked for a rebrand.
4. This document.

When a user choice seems to fight good practice (a color that fails contrast, a font that is hard to read), apply it in a way that works — darker shade for buttons, the font for display only — and explain the adjustment. Don't silently override it.

## 2. Principles

1. **One idea per screen.** Each section makes one point: one headline, a short supporting line, one visual, at most one primary action. Visitors scan; a section that tries to say three things says none.
2. **Typography carries the brand.** Oversized, tightly set display type, calm body text, a disciplined scale. Type alone should make a page look designed before any image loads.
3. **Neutrals do the work, the theme color makes the point.** Roughly 85–90% of the surface is neutral (tinted toward the brand hue); the accent marks what matters: the primary action, a key highlight, active states. A full brand-color field is a deliberate "moment", one or two per page.
4. **Imagery is evidence.** Real people, real places, the real product or interface. Every image proves something (that the place is lovely, the product is real, customers are happy). Decorative stock that proves nothing goes.
5. **Depth from light and layers, not heavy shadows.** Hairline borders, subtle surface steps, soft glows on dark backgrounds. Shadows only for things that float (menus, popovers, sticky bars, a lifted card on hover).
6. **Generous, rhythmic space.** Large section spacing, consistent internal spacing, content that breathes. Whitespace is what makes premium look premium.
7. **Motion is fast, purposeful and optional.** It clarifies state changes and adds polish; it never delays content or hijacks scrolling (motion.md).
8. **Clarity beats cleverness.** A visitor understands what you offer, for whom, and what to do next within five seconds of landing. Beautiful and obvious are compatible: that is the goal.
9. **Craft in the small things.** Focus rings, hover states, empty states, error messages, loading skeletons, the footer, the 404 page. Quality shows where nobody expected effort.
10. **Accessible by default.** WCAG 2.2 AA contrast, real focus styles, keyboard paths, readable sizes, reduced-motion support. Accessibility is a large part of what makes an interface feel effortless.

## 3. Typography

### Choosing typefaces
- At most **two families** (display + text) plus an optional mono for labels, numbers or code. One variable family with good display cuts is often enough.
- Self-host (via Fontsource packages or woff2 files), variable fonts where available, subset to the needed scripts. Load at most 2–3 font files on the critical path.
- Pair by personality. Open-licence starting points (all available on Google Fonts/Fontsource; check the current catalogue):

| Personality | Display | Text | Accent |
|---|---|---|---|
| Precise & technical | Inter Tight, Geist, Hanken Grotesk | Inter, Geist | Geist Mono, JetBrains Mono |
| Calm & premium | Instrument Sans, Manrope, a refined serif like Newsreader | Instrument Sans, Inter | Instrument Serif italic for single words |
| Warm & friendly | Figtree, Plus Jakarta Sans, DM Sans | same family | rounded icons, hand-drawn underline |
| Bold & energetic | Archivo (wide/condensed cuts), Bricolage Grotesque, Anton for short words | Archivo, Inter | big numerals |
| Editorial & refined | Fraunces, Instrument Serif, Young Serif, Libre Caslon Display | Inter, Source Sans 3 | small caps, mono captions |
| Playful & expressive | Bricolage Grotesque, DM Serif Display with italics, Syne | DM Sans, Figtree | stickers, 3D objects |

- Avoid default-looking display faces that read as "template" (Poppins, Montserrat, Raleway, Open Sans, Roboto, Lato as headline fonts). They're fine fallbacks, rarely a brand.

### Scale and setting
Use fluid sizes with `clamp()` so type scales smoothly between 390px and 1440px. A starting scale (tune per preset):

```css
--text-xs: 0.75rem;   --text-sm: 0.875rem;   --text-base: 1rem;   --text-lg: 1.125rem;
--text-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
--display-sm: clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem);
--display-md: clamp(2.25rem, 1.6rem + 3vw, 4rem);
--display-lg: clamp(2.75rem, 1.6rem + 5vw, 6rem);
--display-xl: clamp(3.25rem, 1.2rem + 8vw, 8.5rem);   /* statement heroes only */
```

- **Display:** weight 500–600 for refined, 700–800 for bold; line-height 0.9–1.05; letter-spacing −0.02em to −0.045em (bigger means tighter). Serif displays need less negative tracking (−0.01 to −0.02em).
- **Headings (h2–h4):** line-height 1.1–1.25, tracking −0.01 to −0.025em.
- **Body:** 16–18px (marketing pages lean 17–18px), line-height 1.5–1.65, measure 55–72 characters (`max-width: 65ch`). Grotesks benefit from −0.005 to −0.011em tracking.
- **Labels and eyebrows:** 12–13px, uppercase with +0.04 to +0.08em tracking, or a mono face; weight 500–600.
- **Numbers:** `font-variant-numeric: tabular-nums` for prices, stats, tables and anything that updates.
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs.
- Left-align anything longer than two lines. Centre only short statements and CTA blocks.

### Expressive techniques (use one or two per site)
- **Two-tone headline:** the first clause in full text color, the rest in the muted color. ("Built for teams. *Loved by the people who use it.*")
- **Italic serif accent:** one or two words in an italic serif inside a sans headline, or vice versa.
- **Gradient on a few words:** a subtle same-hue or analogous gradient on one to three words, never on whole paragraphs.
- **Inline glyph:** a small icon or brand mark set inside the headline between words.
- **Giant wordmark or number:** the brand name or a key number at display-xl, with imagery layered over or between letters.

## 4. Color application

All colors come from `app/styles/tokens.css`, generated from the theme color by `scripts/palette.mjs`. Components use **semantic tokens** (`--color-bg`, `--color-text`, `--color-accent`, `--color-on-accent`, `--color-accent-text`, `--color-border`, `--color-success` …), never raw hex values and rarely the ramps directly. Then light/dark switching, re-theming and contrast all stay correct.

- **Primary CTA:** `--color-accent` with `--color-on-accent`. One primary CTA style across the whole site, so visitors learn it.
- **Secondary CTA:** neutral — outline (`--color-border-input`, which keeps the 3:1 boundary contrast) or ghost/text with an arrow.
- **Links in body copy:** `--color-accent-text`, underlined (offset 0.2em, thickness 1px → 2px on hover). Underlines help people with color-vision deficiencies.
- **Brand moments:** a full section on brand color, or on a deep dark surface with the accent glowing. Use one or two per page, to pace the story. On a brand-colored band, check that the CTA still stands out from the band (about 3:1 between button and band); if not, use an inverted button (light on dark, or ink on a light band).
- **Dark bands inside a light page:** wrap the section in `data-theme="dark"` so all tokens flip locally (and vice versa).
- **Text on photos:** always over a scrim (a gradient from transparent to `rgb(0 0 0 / 0.55)` behind the text area) and check contrast.
- **Gradients:** subtle and intentional — same hue ±10% lightness, or theme to an analogous hue (±30°). Glows and mesh gradients belong on dark surfaces at low opacity. No rainbow gradients unless they are the brand.
- **Status colors** (success, warning, danger, info) only for status, never decoration.
- A very light theme color (yellow, lime, sky): use it as a background field, with near-black buttons on top. palette.mjs notes when that applies.
- **Neutrals carry the mood too:** by default they lean slightly toward the brand hue. A cool brand on warm paper (teal or green with cream backgrounds) suits warm, friendly or editorial personalities: generate the tokens with `--neutral-hue warm` (or `cool` for the reverse) instead of editing the output.

## 5. Layout, spacing and rhythm

- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. Internal component spacing comes from the small end, section spacing from the large end.
- **Section padding:** `clamp(64px, 10vw, 144px)` vertically; give the hero more, the sections right after it slightly less, so the page has tempo.
- **Containers:** about 1200px for content pages, 1320–1440px for catalogues and bento grids, about 720px for long-form text. Side gutters `clamp(20px, 5vw, 64px)`.
- **Grids:** a 12-column grid on desktop, 4 on mobile, or intrinsic grids (`repeat(auto-fit, minmax(280px, 1fr))`). Asymmetric splits (5/7, 4/8) feel more designed than 6/6.
- **Section patterns that read well:**
  - *Split:* headline and copy on one side, visual on the other; alternate sides down the page only when it helps the story.
  - *Bento:* a grid of differently sized tiles, each proving one capability with a small visual or UI fragment.
  - *Sticky split-scroll:* headline and CTA stay pinned in one column while numbered points or images scroll past in the other.
  - *Editorial:* eyebrow with a thin rule, large heading, two-column body, numbered items (01–06).
  - *Proof band:* logos, ratings, a single striking number or quote, directly under the hero.
- **Alternate section moods** (light, subtle, dark, brand) to pace a long page, but keep a clear system: two or three moods, not seven.
- **Breakpoints:** design mobile-first. Use container queries for components and a few media queries for page structure (around 640, 960, 1280px or where the content breaks).

## 6. Shape, depth and surfaces

Pick one **shape language** per project and apply it everywhere (buttons, cards, inputs, images, badges):

| Language | Radii (sm / md / lg / xl) | Buttons | Feels |
|---|---|---|---|
| Soft | 10 / 16 / 24 / 32 px | pill | friendly, consumer, warm |
| Precise | 6 / 10 / 14 / 20 px | 8–10px radius or small pill | technical, efficient, trustworthy |
| Editorial | 0 / 2 / 4 / 8 px | square, sometimes with a circular icon button attached | refined, magazine, luxury |

- **Borders:** 1px `--color-border` hairlines separate sections and outline cards. Form controls (inputs, selects, checkboxes, choice chips) use `--color-border-input`, the subtlest neutral with 3:1 contrast against the page, because people must be able to see where to click and type. On dark surfaces borders do the job shadows can't.
- **Elevation:**
  ```css
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 8px 24px -8px rgb(0 0 0 / 0.18);
  --shadow-lg: 0 24px 64px -16px rgb(0 0 0 / 0.28);
  ```
  Use a tinted shadow color on brand-colored elements. In dark mode, express elevation with lighter surfaces (`--color-surface-raised`) and borders instead.
- **Glass:** only for sticky headers and overlays (`backdrop-filter: saturate(1.4) blur(16px)` on a translucent background) with an opaque fallback. Never behind body text.
- **Noise/grain:** an optional, very light texture on large dark or brand surfaces to avoid banding. Use a tiny inline SVG or PNG, never a large image.

## 7. Components: the details that signal quality

**Header.** 64–76px tall on desktop, 56–64px on mobile. Logo left, at most six navigation items, primary CTA right. Sticky; it becomes opaque (or glass) once the page scrolls, without shifting layout. Local businesses can add a phone or WhatsApp icon button. On mobile: a 44px menu button opening a full-height sheet with large links, the CTA and contact options.

**Buttons.** Heights 40 / 48 / 56px (small / default / hero); 16–24px horizontal padding; weight 600. Hover: slightly deeper accent plus a 2–4px arrow nudge. Press: `transform: scale(0.98)`. Focus: a 2px ring offset by 2px in `--color-focus`. Loading state keeps the button width and shows a small spinner. The label is a verb plus value ("Get my quote"), never "Submit".

**Cards.** Padding 20–32px; radius from the shape language; hover lifts by 2px with a shadow or border-color shift. A whole-card link uses one real `<a>` (on the title) stretched with a pseudo-element, so screen readers hear one link.

**Badges and pills.** 24–28px tall, 12–13px text, tinted background (`--color-accent-subtle` with `--color-accent-text`). An **announcement pill** above the hero headline ("New: online booking →") is a great place for a timely message.

**Proof elements.** Logo walls in monochrome at about 60% opacity, 5–7 logos at equal visual weight. Ratings with their source and count ("4.9 on Google · 312 reviews"). Testimonials with a real photo, name, role and a specific outcome. Big numbers with tabular figures and a short label.

**Pricing.** 2–4 plans, the recommended one highlighted, a monthly/annual toggle if relevant, a comparison table under the cards, billing FAQs nearby.

**FAQ.** `<details>`/`<summary>` accordions: no JavaScript, accessible, indexable. Answer first, detail second.

**Footer.** A final CTA band above it. The footer itself is rich: navigation columns, contact details (name, address, phone, for local SEO), opening hours where relevant, socials, legal links, optional newsletter.

**Forms.** See forms.md: conversational, one question at a time for lead forms; labels above fields; 48–56px inputs; helpful inline errors.

**States.** Every list, table, search and form has designed empty, loading (skeleton), error and success states.

## 8. Signature details (pick one to three)

Small, consistent touches make a site memorable. Choose what suits the personality and repeat it across the site:
- Eyebrow labels with a short rule or a mono typeface.
- Numbered items (01, 02, 03) in benefit lists and process steps.
- Two-tone or italic-accent headlines.
- An announcement pill above the hero headline.
- A split CTA: rectangular label button with an attached circular arrow button.
- Hairline grid lines that frame sections, like a technical drawing.
- Product UI fragments (status pills, toasts, chart snippets) used as proof visuals.
- Glossy 3D objects as feature illustrations (generated or sourced consistently).
- Color "worlds": each feature section in its own deep tone with a matching accent.
- Tilted photo cards or a collage of real people.
- A scroll cue line at the bottom of the hero ("Scroll to see how it works ↓"), or a curiosity hook.
- Transparency microcopy close to decisions ("Prices include all fees", "Reply within one business day").
- A giant wordmark or number with imagery layered between letters.

## 9. Mobile and touch

- Most visitors are on phones: design the 390px layout first and test it at 360px.
- Tap targets at least 44×44px with 8px between them.
- Keep the primary action reachable: a sticky bottom CTA bar on mobile appears after the hero scrolls out (not on top of the hero's own CTA, and it must not cover content or cookie notices).
- No hover-only information. Carousels use native scroll-snap, show a peek of the next card, and never autoplay key content.
- Context-aware CTA priority: on mobile an app download or a call button may deserve the primary slot, on desktop the form or account sign-up.
- Inputs use the right `type`, `inputmode` and `autocomplete` so the right keyboard appears and autofill works.

## 10. Dark mode done properly

- Never pure black backgrounds or pure white body text: near-black tinted surfaces and 92–96% white text (the tokens handle this).
- Express elevation with lighter surfaces and borders, not shadows.
- Reduce the area of saturated brand color; let the accent glow on smaller elements.
- Dim photos slightly if they glare (`filter: brightness(0.92)`), and give logos and dark artwork a light variant.
- Test both modes on every page; a component that only looks right in one mode is a bug.

## 11. Anti-patterns

Avoid these. They make sites look generic, slow or untrustworthy:
- **Template tells:** everything centred; three identical cards with emoji or stock icons; purple-to-blue gradients without a reason; generic stock photos (handshakes, people pointing at screens); "Welcome to our website" headlines.
- **Speed and SEO killers:** preloaders and splash screens; hero content hidden until JavaScript or an animation runs; scroll-jacking and smooth-scroll libraries; heavy parallax; autoplaying hero sliders; huge background videos without a poster; chat widgets and third-party scripts loading on first paint.
- **Hostile patterns:** popups on load or on exit intent (they also hurt rankings on mobile); cookie walls that block content; fake urgency or invented reviews; pre-ticked consent boxes.
- **Readability failures:** low-contrast grey text; body text under 16px; lines wider than 80 characters; text over busy photos without a scrim; all-caps paragraphs.
- **Lorem ipsum** or placeholder images in anything that ships.

## 12. Analysing reference images

When the user supplies example pictures (screenshots, moodboards, photos of print work), they override this document's defaults. Copy them to `design/references/`, look at each one carefully, and write a short *Reference analysis* into DESIGN.md:

- **Palette:** dominant background, text and accent colors; light or dark; warm or cool neutrals. (If the references clash with the chosen theme color, ask which wins.)
- **Typography:** serif or sans, weight, case, tracking, size contrast between display and body.
- **Layout:** grid, alignment, density, whitespace, how sections are separated.
- **Shape and depth:** radii, borders, shadows, glass, texture.
- **Imagery:** photography style (light, color grade, framing), illustration or 3D style, how images are cropped and framed.
- **Details:** recurring signature touches, iconography, button and navigation styles, motion hints.
- **Adopt / avoid:** what you will carry into the presets and what you deliberately won't, with reasons.

Then make all five presets speak that language, varying composition and emphasis rather than style, and say so when you present them.
