# Page anatomy: how a page persuades

A converting page is a guided conversation. Each section answers the next question in the visitor's head, in the order they ask it. This file gives the narrative arc, a library of sections (with their job, variants and pitfalls), and the anatomy of each page template.

## Contents
1. The narrative arc of a homepage or landing page
2. Section library
3. Page templates
4. Navigation, header and footer
5. Mobile specifics
6. Checklist per page

## 1. The narrative arc

| # | Visitor's question | Section | Must contain |
|---|---|---|---|
| 1 | What is this, is it for me? | **Hero** | Outcome headline, specific subheadline, primary CTA, a proof point, a visual that shows the offer |
| 2 | Can I trust them? | **Proof band** | Ratings with source, client logos, a key number, or a press mention |
| 3 | Do they understand my problem? | **Problem / situation** | The visitor's pain in their words; the cost of doing nothing |
| 4 | How does it work? | **Solution / how it works** | 3 (max 4) steps; what happens after they click |
| 5 | What's in it for me? | **Benefits / services** | Outcomes, with features as supporting evidence |
| 6 | Does it work for people like me? | **Social proof** | Testimonials with faces and results, case studies, before/after |
| 7 | What does it cost, what do I get? | **Offer / pricing** | Prices or ranges, what's included, recommended option |
| 8 | What if…? | **Objections / FAQ** | Real questions from research and sales calls, answered plainly |
| 9 | OK, what now? | **Final CTA** | Restated promise, the CTA (or the lead form), risk reducers, alternative contact |

Not every page needs every step: a strong local-service page might merge 3 and 5; a SaaS page adds integrations and security. But skipping a question the visitor has costs conversions, and answering questions nobody asks costs attention.

**Pacing:** alternate dense and light sections; use one or two "brand moments" (full-colour or dark sections); keep the primary CTA reachable (header, mid-page, end, sticky on mobile).

## 2. Section library

Each section: its job, layout variants, and what to avoid. A section used on more than one page becomes a component in `app/components/sections/` with props for its content, so pages compose them; a one-off section stays with its route (in the route file, or in the route's folder: `app/routes/about/Story.tsx` with its own `.module.css`) until a second page needs it.

**Hero.** Job: the five-second answer and the first click.
- Variants (design-language.md section 7): type-led statement across the width; full-bleed photo/video with the copy on a scrim; stacked stage (headline wide on top, a large visual below); layered (headline over the edge of an image); product-UI hero; form-first (first question of the lead form with chips); search-first (catalogues, real estate); split copy + visual, only when the visual must sit beside the words, and then breaking the box.
- Avoid: the default half-text, half-photo split; an announcement pill or chip above the headline; carousels/sliders, vague slogans, three competing CTAs, hero content that waits for animation.

**Proof band.** Job: borrow trust immediately after the promise.
- Variants: logo wall (monochrome, 5–7 logos), rating strip ("4.9 ★ on Google · 312 reviews"), single big number, press quotes.
- Avoid: logos without permission, unsourced ratings.

**Problem.** Job: make visitors feel understood.
- Variants: short empathetic statement with 3 pain points; "Sound familiar?" list; a before/after comparison.
- Avoid: fear-mongering, long essays.

**How it works.** Job: reduce perceived effort and risk.
- Variants: 3 numbered steps with icons or small visuals; a timeline; a sticky split-scroll with numbered steps.
- Avoid: more than 4 steps; internal process jargon.

**Benefits / services.** Job: show the value, and route visitors to the right service page.
- Variants: bento grid; numbered editorial list across the grid; service cards linking to service pages; tabbed use cases; a short run of feature rows (copy beside a visual).
- Avoid: identical icon cards with generic copy; feature names without outcomes; zig-zag rows (text and image swapping sides) down the whole page.

**Social proof.** Job: let customers persuade.
- Variants: testimonial grid with photos; one large featured quote; case study cards with a metric; video testimonials (poster frame, click to play); review widget output rendered server-side (not a slow third-party script).
- Avoid: anonymous quotes, invented reviews, autoplaying carousels.

**Offer / pricing.** Job: make the decision concrete.
- Variants: 2–4 plan cards with the recommended one highlighted; price table with "from" prices; packages with what's included; "price on request" with an instant estimate tool.
- Avoid: hiding all prices when competitors show them; too many tiers.

**FAQ.** Job: remove last doubts (and capture long-tail search phrasing).
- Variants: two-column accordion (`<details>`); grouped FAQ by topic on its own page.
- Avoid: marketing fluff dressed as questions; FAQ-schema expectations (no rich result anymore).

**Final CTA.** Job: convert those who read everything.
- Variants: CTA band with headline and button; embedded conversational form (first steps visible); contact options trio (form, phone/WhatsApp, booking).
- Avoid: a different CTA than the rest of the page.

**Supporting sections:** stats band, team/founder, about/story, gallery, comparison table, integrations, security/compliance, newsletter, location/map (click-to-load), blog teasers, awards.

## 3. Page templates

**Home.** The arc above, with routes into service pages. Keep it focused: it isn't a sitemap.

**Service (or solution) page.** Targets one keyword cluster. Hero with the service promise → who it's for → what's included → process → pricing or price indication → proof specific to this service → FAQ for this service → CTA (form pre-filled with this service as the first answer, via a hidden or preselected field).

**About.** The story and the people: why the business exists, who's behind it (real photos), values shown through proof, milestones, credentials. Ends with a CTA, because about-page visitors are often close to deciding.

**Pricing.** Plans or packages, comparison table, what's included, billing FAQ, guarantees, contact for custom needs.

**Case study / portfolio item.** Client and context → challenge → approach → result with numbers → testimonial → related work → CTA ("Have a similar project?").

**Blog index and article.** Articles answer real search questions in depth: title with the query, author with credentials, date, table of contents for long pieces, answer-first intro, scannable sections, original images or diagrams, internal links to the relevant service, a contextual CTA. Index: categories, featured article, pagination with real links.

**Contact.** The conversational form, plus phone, WhatsApp, email, address with map (click-to-load), opening hours, response-time promise. Server-rendered (it has the form's action).

**FAQ / help.** Grouped questions, search on larger sets, contact fallback.

**Legal pages** (privacy, terms, cookies, imprint): plain readable typography, last-updated date, linked from the footer. Draft from the business's actual practices and tell the user to have them reviewed.

**404.** Friendly message, search or popular links, contact. Returns a real 404 status.

**Thank-you (optional).** Confirms, sets expectations, offers a next step; `noindex`; used when conversions are tracked by URL.

## 4. Navigation, header and footer

- **Header:** logo left, 4–6 items max, primary CTA right. For local businesses, a phone or WhatsApp icon. Mega menus only for genuinely large sites.
- **Mobile navigation:** full-height sheet with large links, the CTA and contact options; the header stays slim.
- **No breadcrumb trails** ("Home / Services / Sports massage") on any page. The header marks the active section (`aria-current`), a plain-text eyebrow (never a pill) can name the page's context, and the content links back to its hub ("All services") and sideways to related pages.
- **Footer:** final CTA band above it; then navigation columns, full contact details (name, address, phone, email, hours), socials, legal links, company registration details where required.
- **Campaign landing pages:** strip navigation down to the logo (and maybe a phone number).

## 5. Mobile specifics

- The hero fits in the first screen at 390×844 with headline, subheadline, CTA and the start of a visual or proof.
- After the hero scrolls away, a slim sticky bar can keep the primary action (and call/WhatsApp) in reach. It must never cover content or the consent banner, and it hides while the on-screen keyboard is open.
- Replace hover effects with visible affordances; make every card a single large tap target.
- Shorter copy per section on mobile is fine; hiding important content isn't.

## 6. Checklist per page

- [ ] Five-second test passes (what, for whom, next step).
- [ ] One primary CTA, consistent wording, visible without scrolling.
- [ ] Each section answers one visitor question; none of the arc's questions is skipped without reason.
- [ ] Proof near every ask.
- [ ] The page's keyword cluster is covered naturally (seo-plan.md).
- [ ] Real content, real images, real numbers.
- [ ] Works and looks designed at 390px and 1440px.
- [ ] Sections use the full width at desktop sizes (no centred container column), there is no breadcrumb trail, and no heading has a pill or chip above it.
