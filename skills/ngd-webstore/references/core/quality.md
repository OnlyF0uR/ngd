# Verify and hand over

Nothing ships on "it builds". Verification proves the site is fast, findable, accessible, faithful to the chosen preset and ready to deploy. Run it at the end of the build and after any large change. Fix what you find, then run it again.

## Contents
1. Automated checks (run all)
2. Visual review against the chosen preset
3. Performance
4. SEO
5. Accessibility
6. Content and conversion
7. Code quality
8. Definition of done
9. Handover message

## 1. Automated checks (run all)

```sh
npm run typecheck                                  # wrangler types + react-router typegen + tsc
npm run build                                      # includes prerendering
node <skill>/scripts/ngd-audit.mjs .               # NGD rules: versions, CSS budget, SEO tags, forms vs prerender …
npx wrangler deploy --dry-run --outdir .wrangler/dry-run   # bundles the Worker exactly as deploy would
npm run preview                                    # serves the build in the Workers runtime (workerd)
node <skill>/scripts/screenshot.mjs http://localhost:4173/ /contact /pricing --widths 390,768,1440
node <skill>/scripts/screenshot.mjs http://localhost:4173/ /contact --widths 390,1440 --theme dark   # if dark mode exists
```

`<skill>` is this skill's directory. The screenshot script fails on runtime errors, HTTP errors and horizontal overflow; treat each as a bug. If Playwright is missing, install it in the project as a dev dependency or skip visual checks and say so.

**Lighthouse** (mobile, for the homepage and one page of each template):

```sh
CHROME_PATH=<path-to-chrome> npx lighthouse http://localhost:4173/ --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=design/lighthouse-home.html
```

Two local caveats: `vite preview` serves uncompressed files (performance looks worse than production), and the robots route blocks non-production hosts (SEO reports "blocked from indexing"). For real numbers, run Lighthouse against a preview deployment (`npx wrangler versions upload` gives a URL) or serve `build/client` through a compressing static server for prerendered pages.

## 2. Visual review against the chosen preset

Open the screenshots next to the chosen preset and check honestly:
- Same typography (families, weights, scale, tracking), spacing rhythm, shape language, color application and signature details.
- Mobile layout as designed: navigation, hero, tap targets, no cramped or overflowing elements at 390px (and readable at 360px).
- Dark mode (if offered) looks designed, not inverted.
- Images sharp, correctly cropped, consistent in style; no placeholders left (unless agreed and listed in `design/image-slots.md`).
- Empty, loading, error and success states look intentional.
If something deviates on purpose (performance, accessibility, content length), note it for the handover.

## 3. Performance

- Lighthouse mobile Performance ≥ 95 on indexed pages (production-like conditions), CLS < 0.05, TBT near 0.
- LCP element is the intended hero (heading or image); the image has `fetchpriority="high"`, isn't lazy, and has an appropriate size.
- No render-blocking third-party scripts; analytics deferred; embeds (maps, video, booking widgets, chat) load on interaction.
- Fonts: at most 2 preloaded files; no layout shift on swap.
- JavaScript per route stays within budget (architecture.md section 15); heavy widgets are lazy-loaded.
- Prerendered pages are served as static files (no Worker invocation); dynamic pages have sensible caching.

## 4. SEO

- Every indexable page: unique title (≈50–60 characters) and description (≈150–160), one H1, canonical with the production URL, Open Graph image, `lang` attribute, structured data that validates and matches visible content.
- `sitemap.xml` lists exactly the canonical, indexable pages; `robots.txt` on production allows crawling and references the sitemap; non-production hosts are disallowed.
- Real 404 status for unknown URLs; 301s for moved URLs; one trailing-slash policy; no redirect chains.
- `noindex` on thank-you pages, internal search, panels, cart and checkout.
- Internal links are real `<a href>` links; breadcrumbs on deep pages.
- The keyword plan is implemented: each page's primary cluster appears naturally in title, H1, intro and a subheading.
- Before launch: Cloudflare bot / AI-crawler settings don't block search crawlers (seo.md section 9).

## 5. Accessibility (WCAG 2.2 AA)

- Keyboard: everything reachable and operable with Tab/Shift+Tab/Enter/Space/Escape; visible focus everywhere; no keyboard traps; skip link works.
- Landmarks (`header`, `nav`, `main`, `footer`), logical heading order, descriptive link text.
- Contrast passes (palette.mjs reports the token pairs; also check text on images).
- Images: meaningful alt text; decorative images `alt=""`.
- Forms: visible labels, errors announced and tied to fields (`aria-describedby`), focus moves sensibly between steps.
- Motion: reduced motion respected; nothing flashes.
- Tap targets ≥ 44×44 px; text resizes to 200% without breaking.
- Zoomed and narrow screens: no horizontal scrolling at 320px wide.

## 6. Content and conversion

- No lorem ipsum, "TBD", placeholder phone numbers or example.com addresses (unless the user knows and agreed).
- Copy matches the brief: audience, tone, form of address, language(s); spelling checked.
- The primary CTA is visible in the first viewport on mobile and desktop and repeated at the end of long pages.
- Every claim, review and number is real and attributable.
- Lead form tested end to end: validation, submission, success message, delivery to the agreed destination (or clearly documented as pending configuration).
- Legal pages exist where needed (privacy, terms, imprint/company details, cookie information) and are linked in the footer.
- Contact details consistent everywhere (site config).

## 7. Code quality

- `ngd-audit.mjs` passes without FAIL; WARNs are fixed or explained.
- `global.css` within budget; every component and route styles itself through its own `.module.css`.
- No duplicated components or copy-pasted CSS blocks; shared facts come from `lib/site.ts` and `content/`.
- No unused dependencies, dead files, console logs or commented-out experiments.
- Secrets only in Worker secrets / `.dev.vars`; `.dev.vars.example` documents the names.
- `DESIGN.md` reflects what was built (status, decisions, assumptions, next steps).

## 8. Definition of done

- [ ] Typecheck, build and Worker dry-run succeed.
- [ ] `ngd-audit.mjs` reports no FAIL.
- [ ] Screenshots at 390/768/1440 reviewed (and dark mode if present); no runtime errors or overflow.
- [ ] Lighthouse (production-like): Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100 on key pages, or a written reason for each gap.
- [ ] The build matches the chosen preset; deviations are listed.
- [ ] SEO plan implemented; sitemap, robots, canonicals, structured data verified.
- [ ] Forms and other conversions tested end to end.
- [ ] DESIGN.md updated with status "verify" or "shipped" and next steps.
- [ ] Skill-specific items in SKILL.md checked.

## 9. Handover message

Finish with a short, scannable summary for the user:
1. **What was built:** pages/screens, notable features, the chosen direction.
2. **How to run it:** `npm install`, `cp .dev.vars.example .dev.vars`, `npm run dev`.
3. **How to deploy:** `npx wrangler login`, create the bindings you used (D1, KV…) and apply migrations, `npx wrangler secret put …` for each secret, `npm run deploy`, add the custom domain.
4. **What needs their input:** real content or images still missing, secrets and accounts (Turnstile keys, email destination), legal text review, analytics choice.
5. **After launch:** verify the domain in Google Search Console and Bing Webmaster Tools and submit the sitemap, check the Cloudflare bot settings, set up the Google Business Profile for local businesses, review Search Console and lead-form drop-off after a few weeks.
6. **Verification results:** the Lighthouse scores and any known gaps.
