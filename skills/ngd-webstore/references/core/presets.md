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
- **Include a range:** at least one that feels category-native and safe, at least one that feels bold, and one that leads with conversion (form or booking in or right under the hero; for panels, one that leads with the top task).
- **Name each preset after its idea** ("Quiet Authority", "Sunday Market", "Night Shift"), not "Option 1". Names make feedback easy ("more Sunday Market, less pink").
- **Respect fixed answers.** If the user chose dark only, all five are dark; vary the rest. If they supplied reference images, all five keep the references' style DNA (palette, type mood, shape, imagery style) and vary layout, composition and emphasis. Tell the user that is what you did.
- **Draw on the archetypes** listed in the skill's SKILL.md, but combine and adapt them to the brief; don't use them as fixed templates.

## 3. Building the file

Write each preset as a few small files and let `build-presets.mjs` assemble them into the viewer (`assets/presets-shell.html`: preset tabs, desktop/tablet/mobile and overview modes, a light/dark toggle, a notes drawer, keyboard shortcuts, placeholder and skeleton helpers, an icon sprite). Small files keep every edit small, so one preset can be fixed without touching the others.

1. **Start the round** (from the project folder):
   ```sh
   node <skill-dir>/scripts/build-presets.mjs --init design/presets/round-1 --project "Studio Name" --brand "#hex" --mode light --lang nl
   ```
   This writes `presets.json` and `tokens.css` (the exact palette.mjs output, so what the user approves is what ships; `--mode` as chosen in discovery; light or dark bands keep working either way). Palette options such as `--neutral-hue warm` and `--tint` are passed through; use the same ones later for the production tokens.
2. **Fill in `presets.json`:** a name per preset, its themes (`"light dark"`, `"light"` or `"dark"`), and the font stylesheet URLs (Google Fonts, only the weights you use; every font stack still ends in a system fallback so the file reads well offline).
3. **Write each preset** as `p1.html` (the page inside the frame: header with desktop and mobile navigation, main, footer), `p1.css` and `p1.notes.html` (the rationale: layout, typography, color & shape, imagery, motion idea, conversion path, trade-offs, in a `<dl>` under an `<h2>`). Optional: `p1.js` for a small demo (it runs with `root` set to the preset), `shared.css` for helpers every preset uses, `symbols.svg` for extra icons. Round 2 continues with `p6`–`p10`.
4. **CSS is scoped for you:** `p1.css` is the inside of `#p1 { … }`. Bare declarations style the whole preset (`font-family`), nested rules style its parts. Make everything respond to the frame, not the window: the frame is a container, so use `@container page (width >= 900px) { … }` for layout and container units for fluid sizes (`font-size: clamp(2.5rem, 7cqi, 5.5rem)`; `vw` would measure the whole browser window and show desktop-sized type in the 390px mobile view). Sticky elements use `top: var(--ngd-top, 0px)` so they stick below the viewer's toolbar. Use the semantic tokens (`var(--color-accent)`, `var(--color-text-muted)` …) instead of raw hex values so light/dark switching and the final build stay consistent. A dark band inside a light page is `<section data-theme="dark">`; the tokens flip locally. Put `@keyframes` at the top level of the file and prefix their names (`p1-rise`). Prefix ids too (`p1-email`), because all presets share one page.
5. **Build after every preset** and check it before writing the next (section 4):
   ```sh
   node <skill-dir>/scripts/build-presets.mjs design/presets/round-1    # writes design/presets/round-1.html
   ```
   The builder includes a preset as soon as its `.html` exists and warns about missing notes, duplicate ids, raw colors and file size.
6. **Motion:** demo the intended motion with a little CSS (a hover state, one reveal), wrapped in `@media (prefers-reduced-motion: no-preference)`. Describe the full motion idea in the notes instead of building it.
7. **Interactive bits:** a short `pN.js` is fine for something essential: the first two steps of the conversational form, a variant picker, a sidebar collapse. Keep it under about 40 lines.
8. **Content parity.** Use the same draft copy across presets, adapted only where the layout demands. That way the user compares design, not wording. One exception is welcome: a preset can show a different headline angle if you say so in its notes.
9. **Proof you don't have yet.** Show only real facts: the real rating and review count if known, real logos the user may publish. Where a quote or number is still missing, use a visibly marked placeholder ("Review from Google, to be chosen") instead of inventing one; mark a number that still needs confirming with `<span class="tbd" title="To be confirmed">4.8</span>` (dotted underline).
10. **More than one page in a preset** (a shop's product page, a panel's second screen): separate the parts with `<div class="ngd-part" data-part="Product page"></div>`. It renders a labelled divider, and the screenshot script captures each part on its own.

Keep the output lean: aim for under about 150 KB, no base64-embedded photos (reference local images by relative path), no external scripts or CSS frameworks.

Without Node, fill the shell by hand: copy `assets/presets-shell.html` to `design/presets/round-1.html` and fill the points marked with `ngd:` comments (fonts, tokens, styles, symbols, the presets between the start and end markers, scripts), plus the title, `lang` and the toolbar name. Write one preset per edit.

## 4. Checking your work before showing it

Run `node <skill-dir>/scripts/screenshot.mjs design/presets/round-1.html --presets` from the project folder (add `--theme dark` for the dark variants). It captures every preset at desktop and mobile width into `design/presets/shots/` with reduced motion (so reveals can't hide content) and reports runtime errors, problems in the file itself (broken head, leftover shell tokens, duplicate ids, missing notes) and anything sticking out of the 390px frame. A clean run only means nothing is broken. If Playwright isn't available, open the file in a browser if you can, or review the markup carefully, and tell the user the screenshots were skipped. Then **look at the screenshots** yourself and fix:
- anything broken at 390px (overflow, text overlapping images, cramped nav);
- presets that look too similar to each other: push the difference further;
- presets that look generic: check the anti-patterns list in design-language.md (centred-everything, three identical icon cards, purple gradients for no reason, stock-photo clichés);
- weak hierarchy: the headline and primary CTA should be obvious within one glance at the first screen;
- contrast problems, especially text on images.

## 5. Presenting and asking

Show the file in the most direct way available: publish or open it if you have an artifact or preview tool (the file is self-contained: inline CSS and scripts, fonts from Google Fonts, which most publishing tools accept; publish it privately, it's a draft), otherwise give the path and tell the user to open it in a browser. If your interface can show images, include the desktop screenshot of each preset too.

Then, in a short message:
- one line per preset: number, name, the idea, who it suits;
- your recommendation and why (tie it to their audience and goal);
- the ask, in plain text (the choice has more than four options, and mixes need free text):

> Which direction should I build? Reply with a number, or:
> - mix them ("hero of 2 with the sections of 4"),
> - tweak one ("3, but warmer and with a bigger photo"),
> - or ask for five new directions (tell me what you liked and didn't).

## 6. Iterating: tweaks, mixes, more rounds

- **Tweak:** edit that preset's files, rebuild and re-check. Say what you changed.
- **Mix:** build the combination as one new preset in the same round with the next free number (add an entry to `presets.json` with `"index": 6`, write `p6.*`) and show just that one. Mixing can produce something incoherent; a quick look avoids building the wrong thing. Numbers are never reused, so the user can always refer to "6": if a mix took 6, give the next round's entries `index` 7–11.
- **More:** start `design/presets/round-2` with `--init` (it numbers the presets 6–10) and build five new directions. Write down what the user liked and disliked first and use it: keep what they praised, explore what you haven't tried, drop what they rejected. Never quietly repeat a rejected idea.
- If the user is stuck after two rounds, ask two or three sharp either/or questions ("airy or dense? photo-led or type-led?") rather than generating another five.

## 7. Locking the choice in

When the user picks:
1. Record the choice in DESIGN.md → *Chosen direction*: preset file and number, plus the concrete decisions the build needs — fonts and weights, type scale, radius scale, spacing rhythm, color application, navigation pattern, hero layout, section order, signature details, motion notes, and any changes requested.
2. Keep `design/` in the repository (it documents the decision) but outside `public/` so it is never deployed.
3. Move to the foundation phase. Build the chosen preset's look faithfully; when something must change for real-world reasons (performance, accessibility, content), tell the user what and why.
