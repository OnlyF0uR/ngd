# Discovery interview

The interview decides most of the outcome. Its job: learn enough to produce five on-brief, genuinely different presets and, later, a site that converts — without making the user feel interrogated.

## Contents
1. Ground rules
2. Round 1 — the business and the goal
3. Round 2 — look and feel (theme color, color mode, personality, type)
4. Round 3 — imagery, motion, content, practicalities
5. Skill-specific questions
6. Writing DESIGN.md and playing it back
7. Example of a good round

## 1. Ground rules

- **Read before you ask.** Pull everything you can from the request, attachments, an existing repo, an existing website (fetch it), the user's brand assets and any `DESIGN.md` from an earlier session. Ask only for what is still missing, and play back what you inferred ("I'm assuming the site is Dutch-only — correct me if not") so the user can correct it in one line.
- **Rounds, not a drip.** At most three rounds, each with no more than six questions. Fewer rounds when the request is detailed. One question per message wastes the user's time; twenty questions in one message overwhelms them.
- **Every question has a recommended default**, so "go with your suggestions" is a complete answer. When the user says "you decide", decide, and log it under *Assumptions to confirm* in DESIGN.md.
- **Use a structured question tool when you have one** (for example AskUserQuestion: up to 4 questions per call, 2–4 options each, put your recommendation first and label it "(Recommended)"; the user can always type their own answer). Use plain text for open questions (what the business does, what makes it different) — offering options there puts words in the user's mouth.
- **Be honest about capabilities.** Offer AI image generation only if an image-generation tool is actually connected, and name it. Promise search-volume numbers only if you have an SEO data source; otherwise say volumes will be estimates.
- **One interview for several surfaces.** If more than one ngd skill is active, merge their extra questions into these rounds.
- **Explain why when it helps the user answer.** "Where should form submissions go? (So leads don't end up in a mailbox nobody reads.)"

## 2. Round 1 — the business and the goal

Ask as open questions in a single message (skip any already answered):

1. **What are we building, for whom?** Business/product name, what you offer, your ideal customer, where they are (city/region/country) and which language(s) the site needs.
2. **What should a visitor do?** The one primary action (request a quote, book a call or appointment, buy, sign up, download the app, call or WhatsApp) and any secondary ones (newsletter, download a brochure, visit the shop).
3. **Why you?** What makes you the better choice, the proof you have (reviews and where they live, numbers, certifications, notable clients, press), and the doubts customers usually raise before buying.
4. **What exists already?** Domain, current website (I'll analyse it and keep its search rankings with redirects), logo and brand guidelines, existing copy, photos, and examples or screenshots of sites you like. Reference images steer the design more than my defaults do.
5. **Competitors.** Two or three competitors or sites in your space (for differentiation and keyword research). Sites you dislike are useful too.

## 3. Round 2 — look and feel

### Theme color — how to ask
The user either gives a theme color or picks one of three you propose.

1. **If they have a brand color** (stated, in the logo SVG, in brand guidelines): confirm it — "I'll use #0F766E from your logo as the theme color" — and still offer the alternative of choosing.
2. **Otherwise propose three candidates**, each with a name, hex, one-line rationale and the feeling it creates:
   - **A — Category-native, refined.** The color the category is trusted for, tuned to look premium rather than default (wellness → a deep sage, not stock green).
   - **B — Differentiating.** A color none of the main competitors use, so the brand is recognisable in a row of search results.
   - **C — Bold.** Memorable and high-energy, or unusually premium (a deep ink, an electric hue). More risk, more recall.
   Base the candidates on round 1: industry, audience, personality hints, competitors' colors. Avoid generic "SaaS indigo" unless it is clearly right.
3. **Validate before showing.** Run `node scripts/palette.mjs --candidates "#a,#b,#c" --preview design/theme-options.html`. If a candidate cannot produce accessible buttons and text in both light and dark mode, adjust it or swap it. Read the notes: a light brand color (yellow, lime, sky) becomes a background field with dark buttons; a mid-tone color may get a slightly deeper shade for buttons. Tell the user in plain words when that applies.
4. **Show them visually when you can** (open or publish the preview HTML; otherwise list name + hex + rationale). Ask: "Pick A, B or C — or give me your own color (a hex code, or a description like 'deep forest green')." Convert descriptions to a hex and confirm.

### The other look-and-feel questions
- **Color mode:** light, dark, or both following the visitor's system setting with a toggle. Recommend per context: dark suits developer tools, nightlife, premium tech; light suits most local services, health, e-commerce; panels usually benefit from both.
- **Personality (pick up to two):** calm & premium · bold & energetic · warm & friendly · precise & technical · playful & expressive · editorial & refined. This drives typography, shape language and motion; it is the most useful single answer for the presets.
- **Typography preference (optional):** modern sans · elegant serif headlines · rounded & friendly · "you choose" (recommended unless they have brand fonts). Ask whether they own brand fonts and their license allows web use.

## 4. Round 3 — imagery, motion, content, practicalities

### Images
Ask: **"Will the site use photos or illustrations?"**
- **Yes — I'll provide them.** Follow up: *where can I find them?* A folder in the repo, a URL or a downloadable link. You can only use what is reachable from your environment — say so if a link needs to be public. Ask which images are must-use (team, premises, products).
- **Yes — generate them with AI.** Offer this only when an image-generation tool is connected (name it). Follow up on style direction (e.g. warm natural light, editorial portraits, clean 3D product renders, abstract) and check credits/cost before generating; some tools need you to request an estimate and get approval first. See imagery.md for what must never be generated (fake customers, fake staff, misleading product photos).
- **Yes — use stock photos.** Free-licence sources (e.g. Unsplash, Pexels); you pick and log sources in `design/image-credits.md`.
- **No / mostly typography and interface.** The design leans on type, color fields, shapes, icons and product UI.
- Mixed answers are fine ("my product photos + stock for lifestyle").

### Animations
Ask two separate questions, because they are different experiences:
- **Entrance animations when a page loads:** none · subtle (recommended — headline and visuals settle in quickly) · expressive (choreographed hero, more personality).
- **Scroll animations:** none · subtle reveals (recommended) · storytelling (sticky sections, scroll-linked effects).
Mention that motion never delays content and always respects the "reduce motion" setting — some users worry animation means slow.

### Content and conversion
- **Pages:** propose a sitemap based on the site type and round 1 (see the skill's own guidance); ask what to add or remove.
- **Copy:** "Do you have copy, or shall I write it from your answers and the keyword research? (You review it either way.)" Ask about formal vs informal address where the language has it (Dutch je/u, German du/Sie, French tu/vous).
- **Leads:** where submissions should go (email address, CRM or webhook, Slack, a database you can export), which contact channels to show (form, phone, WhatsApp, booking link, email), and what they need to know about a lead to qualify it — this becomes the steps of the conversational form.
- **Proof:** which testimonials, ratings, logos, case studies or numbers may be published.

### Practicalities (offer defaults; most users accept them)
- **Domain / production URL** (needed for canonical URLs, sitemap and social cards).
- **Analytics:** default Cloudflare Web Analytics (free, no cookies or local storage, no fingerprinting) or their existing tool. In the EU, cookie-setting tools need consent; whether cookieless analytics may run without consent depends on the national regulator, so flag it for their privacy review rather than promising "no banner needed".
- **Legal pages:** privacy policy, terms, imprint/company details where required, cookie policy if needed. You can draft templates; they should have them checked.
- **Cloudflare:** do they have an account, and is the domain's DNS on Cloudflare? (Not needed until deployment.)
- **Accessibility needs** beyond WCAG 2.2 AA (public sector, older audiences), and **deadline/launch date** if it changes priorities.

## 5. Skill-specific questions
Each ngd skill lists extra questions in its SKILL.md (webstore: catalog, payments, shipping, markets; panel: users, roles, data sources, key actions; standard: site type specifics). Fold them into rounds 1 and 3.

## 6. Writing DESIGN.md and playing it back

Create `DESIGN.md` in the project root from `assets/DESIGN.template.md` as soon as round 1 is answered and keep it current. It is the project's memory: later sessions (and other agents) resume from it, so record decisions *and* the reasons. Mark anything not explicitly confirmed under *Assumptions to confirm*.

After the last round, play back a compact summary (8–12 lines: audience, goal, theme color, mode, personality, imagery, motion, sitemap, lead routing) and say what happens next: "Next I'll research keywords and then show you five design directions in one page." Don't wait for another confirmation unless something important is still open.

## 7. Example of a good round

> Thanks — I have a clear picture of the clinic. Two quick rounds and I can show you designs.
>
> **Look & feel**
> 1. Theme color — your logo has no strong color, so here are three (preview: design/theme-options.html):
>    A. Sage #4F7A65 — calm and clinical-but-warm, what patients expect from care
>    B. Clay #B5573A — none of the three local competitors use warm tones; feels personal
>    C. Ink blue #1F3A8A — confident and premium, reads as "specialist"
>    Or give me your own.
> 2. Light, dark or both? *(Recommended: light — fits health, easiest to read for older patients)*
> 3. Personality — pick up to two: calm & premium · warm & friendly · precise & technical · editorial & refined *(Recommended: calm & premium + warm & friendly)*
>
> **Images & motion**
> 4. Will the site use photos? You mentioned photos of the practice — where can I find them? I can also use stock photos for the treatment pages. *(No image generator is connected here, so AI images aren't an option right now.)*
> 5. Entrance animations: none / subtle / expressive *(Recommended: subtle)*
> 6. Scroll animations: none / subtle reveals / storytelling *(Recommended: subtle reveals)*
