# Five skeleton presets

After discovery and research, and before any production code, you show the user five clearly different design directions in **one HTML file**. They pick one, mix, tweak, or ask for more. Only then does the build start. This step exists because people recognise what they want far better than they can describe it, and because changing direction in a skeleton costs minutes while changing it in a built site costs days.

## Contents
1. What a preset is (and isn't)
2. Choosing five directions that are really different
3. Building the file
4. Checking your work before showing it
5. Presenting and asking
6. Iterating: tweaks, mixes, more rounds
7. Locking the choice in

## 1. What a preset is (and isn't)

A preset is a **mid-fidelity skeleton of the most important page** (the skill tells you which: homepage for standard sites, homepage + product views for shops, app shell + dashboard + list for panels). It is detailed enough to judge the feel and too rough to mistake for the final site.

It has:
- the real structure: header and navigation (desktop and mobile), hero, the main sections in the planned order, the final call to action, the footer;
- **real draft copy** from the brief (headline, subheadline, CTA labels, section titles, short body text). Lorem ipsum makes every preset look the same and hides whether the message lands;
- the user's theme color through the generated tokens, and the actual typeface proposals;
- image placeholders that say what the image will show (`<div class="ph"><span>Photo: barista pouring latte art, morning light</span></div>`), or the user's own images when they supplied them;
- one or two **signature details** that make it memorable (see design-language.md);
- responsive behaviour at 390px wide (container queries), because most visitors will be on a phone.

It does not have: every page, final imagery, complete copy, real data, working integrations, or more JavaScript than a small demo needs.

## 2. Choosing five directions that are really different

Five variations of one template are useless: the user can't compare, so they can't choose. Before writing markup, **write down the five directions** — a name and one sentence each — and check they differ on at least three of these axes:

| Axis | Examples of distinct choices |
|---|---|
| Hero composition | split text/visual · centred statement · full-bleed image or video · product UI · form-first · collage |
| Grid and rhythm | classic alternating rows · bento grid · editorial asymmetric · sticky split-scroll · card catalogue |
| Typography | grotesk display · serif display with italic accents · rounded geometric · condensed/expanded · mono labels |
| Shape language | soft (large radii, pills) · precise (small radii, hairlines) · editorial (square, thin rules, circular accents) |
| Color application | neutral page with accent CTAs · brand-color fields · dark theme · alternating light/dark "worlds" per section |
| Navigation | minimal top bar · centred logo with split nav · pill nav · sidebar or bottom bar (apps) · mega menu |
| Density | airy and slow · balanced · compact and information-rich |
| Imagery treatment | full-bleed photos · framed cards · cut-outs and 3D objects · illustrations · no imagery |

Rules of thumb:
- **All five are on-brief.** A daring preset still serves the audience and the conversion goal.
- **Include a range:** at least one that feels category-native and safe, at least one that feels bold, and one that leads with conversion (form or booking in or right under the hero).
- **Name each preset after its idea** ("Quiet Authority", "Sunday Market", "Night Shift"), not "Option 1". Names make feedback easy ("more Sunday Market, less pink").
- **Respect fixed answers.** If the user chose dark only, all five are dark; vary the rest. If they supplied reference images, all five keep the references' style DNA (palette, type mood, shape, imagery style) and vary layout, composition and emphasis. Tell the user that is what you did.
- **Draw on the archetypes** listed in the skill's SKILL.md, but combine and adapt them to the brief; don't use them as fixed templates.

## 3. Building the file

1. **Tokens.** Generate with `node scripts/palette.mjs --brand "#hex"` (add `--mode light` or `--mode dark` if the user chose one). Use the exact output in the presets so what they approve is what ships.
2. **Copy the shell** `assets/presets-shell.html` to `design/presets/round-1.html`. It contains the viewer: preset tabs, desktop/tablet/mobile and overview modes, a light/dark toggle, a notes drawer, keyboard shortcuts, placeholder and skeleton helpers, and an icon sprite (`<svg class="i"><use href="#i-arrow-right"/></svg>`; see the symbols in the file for the full list).
3. **Paste the tokens** into `<style id="tokens">`, set the `<title>` and toolbar name.
4. **Fonts.** In this temporary file only, load the proposed families from Google Fonts with `<link>` (only the weights you use). Always give a system fallback stack: the file must still read well offline.
5. **Write each preset** as a `<section class="preset" id="p1" data-name="…" data-themes="light dark">` containing a `.frame` with the page markup and a `<template class="notes">` with the rationale (layout, typography, color & shape, imagery, motion idea, conversion path, trade-offs). Use `data-themes="dark"` for a dark-only preset.
6. **Scope the CSS per preset** inside `<style id="preset-styles">` with nesting: `#p3 { .hero { … } }`. Make layouts respond to the frame, not the window: `@container page (width >= 900px) { … }`. Use the semantic tokens (`var(--color-accent)`, `var(--color-text-muted)` …) rather than raw hex values, so light/dark switching and the final build stay consistent. A dark band inside a light page is `<section data-theme="dark">` — the tokens flip locally.
7. **Motion:** you may demo the intended motion with a little CSS (a hover state, one reveal). Keep it subtle and wrapped in `@media (prefers-reduced-motion: no-preference)`. Describe the full motion idea in the notes instead of building it.
8. **Interactive bits:** a tiny inline script is fine to demo something essential — the first two steps of the conversational form, a variant picker, a sidebar collapse. Keep it under ~40 lines and make it scoped to its preset.
9. **Content parity.** Use the same draft copy across presets, adapted only where the layout demands. That way the user compares design, not wording. One exception is welcome: a preset can show a different headline angle if you say so in its notes.

Keep the file self-contained (no external scripts or CSS frameworks), and under ~400 KB (no base64-embedded photos; reference local images by relative path).

## 4. Checking your work before showing it

Run `node scripts/screenshot.mjs design/presets/round-1.html --presets --out design/presets/shots`. It captures every preset at desktop and mobile width and reports runtime errors. Then **look at the screenshots** yourself and fix:
- anything broken at 390px (overflow, text overlapping images, cramped nav);
- presets that look too similar to each other: push the difference further;
- presets that look generic: check the anti-patterns list in design-language.md (centred-everything, three identical icon cards, purple gradients for no reason, stock-photo clichés);
- weak hierarchy: the headline and primary CTA should be obvious within one glance at the first screen;
- contrast problems, especially text on images.

## 5. Presenting and asking

Show the file in the most direct way available: publish or open it if you have an artifact/preview tool, otherwise give the path and tell the user to open it in a browser. If your interface can show images, include the desktop screenshot of each preset too.

Then, in a short message:
- one line per preset: number, name, the idea, who it suits;
- your recommendation and why (tie it to their audience and goal);
- the ask, in plain text (the choice has more than four options, and mixes need free text):

> Which direction should I build? Reply with a number, or:
> - mix them ("hero of 2 with the sections of 4"),
> - tweak one ("3, but warmer and with a bigger photo"),
> - or ask for five new directions (tell me what you liked and didn't).

## 6. Iterating: tweaks, mixes, more rounds

- **Tweak:** edit that preset in place and re-check it. Say what you changed.
- **Mix:** build the combination as one new preset in the same file (next free number) and show just that one. Mixing can produce something incoherent; a quick look avoids building the wrong thing.
- **More:** create `design/presets/round-2.html` with five new directions, numbered 6–10 (`data-index`). Write down what the user liked and disliked first and use it: keep what they praised, explore what you haven't tried, drop what they rejected. Never quietly repeat a rejected idea.
- If the user is stuck after two rounds, ask two or three sharp either/or questions ("airy or dense? photo-led or type-led?") rather than generating another five.

## 7. Locking the choice in

When the user picks:
1. Record the choice in DESIGN.md → *Chosen direction*: preset file and number, plus the concrete decisions the build needs — fonts and weights, type scale, radius scale, spacing rhythm, color application, navigation pattern, hero layout, section order, signature details, motion notes, and any changes requested.
2. Keep `design/` in the repository (it documents the decision) but outside `public/` so it is never deployed.
3. Move to the foundation phase. Build the chosen preset's look faithfully; when something must change for real-world reasons (performance, accessibility, content), tell the user what and why.
