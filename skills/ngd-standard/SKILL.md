---
name: ngd-standard
description: Next-generation design (NGD) workflow for landing pages, marketing and company websites, service, portfolio and event sites, and any other public content page that must look stunning, load instantly, rank on Google and generate leads. Interviews the user (theme color or three proposed options, images and whether to generate them, entrance and scroll animations, goals), researches keywords for the niche, shows five skeleton design presets in one HTML file to choose from, then builds the chosen design with the latest React Router (server-rendered or prerendered) on Cloudflare Workers, with CSS Modules and a conversational lead form. Use it whenever someone wants a website, landing page, homepage, one-pager, company or portfolio site, or a redesign of public pages, even if they don't mention design, SEO or Cloudflare. For online shops use ngd-webstore; for dashboards and admin or user panels use ngd-panel; combine them when a project needs several.
---

# NGD Standard: landing pages and content sites

You are designing and building a public website whose job is to turn visitors into leads or customers. It has to look remarkable, explain itself within five seconds, load instantly, be easy to use for everyone, and be found on Google. This skill gives you the shared NGD process plus what's specific to marketing and content sites.

**Non-negotiables, and why they matter:**
- **The user decides the look:** theme color, light/dark, motion and imagery. You propose, validate and apply, but you never impose.
- **Five presets before production code.** People recognise what they want faster than they can describe it.
- **Latest React Router in framework mode.** Every indexed page is server-rendered or prerendered (crawlers and slow phones get complete HTML), and the site is ready to deploy to Cloudflare Workers.
- **CSS Modules for every component and page, plus a small `global.css`** (about 8 KB: tokens, reset, base). Shared code is extracted: one source of truth for facts, components for repeated UI.
- **Fast by construction.** No loading screens, no scroll-jacking, content visible at first paint, Lighthouse mobile ≥ 95. Speed is conversion and ranking.
- **SEO based on real keyword research for the niche**, with complete metadata, structured data, sitemap and robots on every page.
- **Built to convert:** one clear primary action per page, a conversational lead form, and several ways to make contact.
- **Accessible (WCAG 2.2 AA),** because every visitor is a potential customer.

<!-- ngd:workflow:start (generated from shared/snippets/workflow.md; edit there and run `node scripts/sync-shared.mjs` from the repository root) -->
## The NGD workflow (shared by every ngd skill)

Work through the phases in order. Each one ends with something the user can see or approve, so they stay in control and nothing gets built on a guess.

**Paths.** `references/…` and `assets/…` are files in this skill's directory (`<skill-dir>`, shown as the base directory when the skill loads; `${CLAUDE_SKILL_DIR}` in Claude Code). Run the helper scripts from the **project folder** with their full path, `node <skill-dir>/scripts/<script>.mjs …`, so that their output (`design/…`, `app/…`) lands in the project, never in the skill's directory.

| Phase | You produce | Read |
|---|---|---|
| 0. Orient | what exists, which tools and environment you have, which ngd skills apply | this section |
| 1. Discover | interview answers → `DESIGN.md` | `references/core/discovery.md` |
| 2. Research | keyword plan + competitor notes → `design/seo-plan.md` (panels: domain research → `design/panel-plan.md`) | `references/core/seo.md` (panels: the ngd-panel SKILL.md) |
| 3. Presets | five skeleton directions in one HTML file; the user picks | `references/core/presets.md`, `references/core/design-language.md`; for the draft copy, form and motion idea also `copywriting.md`, `forms.md`, `motion.md` and `imagery.md` in `references/core/` |
| 4. Foundation | latest React Router on Cloudflare Workers, tokens, global layer, layout, SEO plumbing | `references/core/architecture.md`, `assets/starter/` (panels: also `assets/starter-panel/`) |
| 5. Build | every page or screen with real content, forms, images, motion | this skill's references, plus `references/core/` forms, copywriting, imagery and motion |
| 6. Verify | checks pass, screenshots reviewed, fixes made | `references/core/quality.md` |
| 7. Hand over | run/deploy instructions and what's left for the user | `references/core/quality.md` |

### Phase 0: orient (before your first question)
- **Resume if possible.** If `DESIGN.md` exists in the project root, read it, tell the user where things stand, and continue from its *Next step* instead of interviewing again.
- **Look at what exists:** an existing codebase (package.json, React Router and Wrangler config), a live site to replace (fetch it: content, structure, URLs that need redirects), brand assets, and any images the user supplied. Reference images outrank the default style: save image files to `design/references/`; for images pasted into the conversation, analyse what you see directly (`references/core/design-language.md`, section 12) and ask for the files only if they're needed in the project.
- **Inventory your tools**, because they change what you can offer: structured questions (such as AskUserQuestion), web search and fetch (keyword research), image generation (any connected tool that creates images), a browser or Playwright (screenshots), a way to show HTML (artifact or preview). Count tools that are listed by name and loaded on demand too. Never offer what you can't do, and when what you find contradicts what the user said (they expect no image tool, but one is connected), mention it once and follow the user.
- **Check the environment** and pick the matching mode:
  - *Full* (a shell with Node and network access, such as Claude Code on a machine or cloud container): every phase as written.
  - *Sandbox without network* (some API and hosted code-execution environments): no installs, scaffolding or web research. Run the interview and presets as written (the scripts need only Node), assemble the project by hand from `assets/starter/`, deliver it as files or a zip with the exact commands the user runs (`npm install`, `npm run build`, deploy), and list every check you couldn't run.
  - *No code execution* (plain chat): run the interview, show the presets as an HTML artifact or file, then deliver the project files with instructions.
  Wherever you are, never claim a check passed that you didn't run.
- **Check which ngd skills apply** (see "Working with other ngd skills" below).
- **Quick mock-up only?** If the user explicitly wants a quick static mock-up (no build, no deployment), say so, run a short interview, and let the presets file be the deliverable; skip phases 4–7 unless they ask for more.

### Phase 1: discover
Run the interview in `references/core/discovery.md`, adding this skill's extra questions (below): three short rounds (a fourth for type-specific details if needed), nothing you could infer, and a recommended default for every question. The theme color either comes from the user or is picked from three options you propose and validate with `node <skill-dir>/scripts/palette.mjs --candidates …`. Ask about images (provided, generated if an image tool is connected, stock, or none, and where to find them) and, separately, entrance and scroll animations. Create `DESIGN.md` from `assets/DESIGN.template.md` and play back a short summary with your assumptions.

### Phase 2: research
For anything that will be indexed, research keywords for the niche, location and language, scan competitors, and map one keyword cluster to each page in `design/seo-plan.md` (`references/core/seo.md`). Share the sitemap and top keywords in a few lines, because it may change what gets built. Then continue straight to the presets; wait for a reply only when a finding needs the user's decision (the site's language, a page or market they didn't plan for). Panels skip keyword research but still research the domain (typical entities, workflows, metrics).

### Phase 3: five skeleton presets
Build five clearly different directions in ONE file, `design/presets/round-1.html`, one preset at a time: write each as small files in `design/presets/round-1/` and assemble them with `node <skill-dir>/scripts/build-presets.mjs design/presets/round-1`. Use real draft copy and the generated tokens, check the file with `node <skill-dir>/scripts/screenshot.mjs design/presets/round-1.html --presets` and look at the screenshots, then show it and ask the user to pick one, mix, tweak, or request five more (`references/core/presets.md`). Write no production code before a direction is chosen. The choice is the user's, and building early wastes their time if they choose differently.

### Phase 4: foundation
Scaffold the latest React Router (framework mode, SSR) on Cloudflare Workers, or upgrade the existing project. Apply the verified starter in `assets/starter/`, generate `app/styles/tokens.css` with `node <skill-dir>/scripts/palette.mjs`, then set up fonts, the small `global.css`, the layout shell, UI primitives and SEO plumbing (`references/core/architecture.md`). Reproduce the chosen preset faithfully: same typography, spacing rhythm, shape language and signature details.

### Phase 5: build
Build every page or screen with this skill's guidance. Every indexed page is rendered on the server: at request time (SSR) or at build time (prerendering, the same complete HTML served as a static file), with complete metadata and structured data. In non-indexed app areas, never block the shell on data: stream or lazy-load it behind skeletons. Extract shared code as you go (a second use becomes a component), keep component and page styles in `.module.css` files, and write real copy in the site's language, including the interface text in `app/lib/site.ts` (`references/core/copywriting.md`). Lorem ipsum never ships.

### Phase 6: verify
Run everything in `references/core/quality.md`: typecheck, build, `node <skill-dir>/scripts/ngd-audit.mjs .`, a Worker dry-run, screenshots at 390/768/1440 (plus dark mode if offered), Lighthouse on key pages, the lead form end to end, and an honest side-by-side review against the chosen preset. Fix what you find, then re-run.

### Phase 7: hand over
Summarise what was built, how to run and deploy it, what needs the user's input (secrets, DNS, content, Search Console), and the verification results, including anything you couldn't check. Update DESIGN.md's status.

### Working with other ngd skills
The ngd skills (**ngd-standard** for landing pages and content sites, **ngd-webstore** for shops, **ngd-panel** for admin and user panels) share this workflow and the files in `references/core/`, `scripts/` and `assets/`. Those files are identical in every ngd skill, so read each one once, from whichever skill you loaded first. When a request spans several surfaces (a shop with an admin panel, a marketing site with a customer portal, a brand site with a shop):
- Load every relevant ngd skill and run this workflow **once**: one interview with the extra questions merged, one `DESIGN.md` with a section per surface, one research pass covering all indexed pages, one project and one design system.
- **Presets:** start with the public surface (webstore or standard), because it defines the brand. Once it's chosen, run a second round of five presets for the panel. They inherit the chosen tokens and typography and vary the app-shell structure and density, and they can be lighter (shell, dashboard, one list). For standard plus webstore, one round whose presets show both a content page and the shop views.
- **Build order:** shared foundation, then the public surface, then the panel.
- The sibling skills sit next to this one (`<skill-dir>/../ngd-panel/SKILL.md` and so on). If a request needs one that isn't loaded, read its SKILL.md from there; if it isn't installed at all, say so and apply the closest guidance from the core references.

### When guidance conflicts
1. The user's explicit answers and instructions.
2. Reference images or brand guidelines the user supplied.
3. Existing brand assets (logo, current site), unless the user wants a rebrand.
4. This skill's defaults (design language, preset archetypes).

Theme color, color mode, fonts, motion level and imagery are always the user's decision: this skill tells you how to ask and how to apply the answer, never what the answer is.
<!-- ngd:workflow:end -->

## What's specific to standard sites

### Extra discovery questions
Merge these into the core rounds and skip whatever the request already answers.

**Ask:**
- **Kind of site:** match it to a playbook in `references/site-playbooks.md` (local service, health and wellness, professional services, SaaS, portfolio, hospitality, real estate, events, personal brand, B2B industrial, non-profit, campaign landing page). This drives the sitemap, sections and schema. Usually you can infer it; then state it instead of asking. Also: one campaign page or a full site? (Campaign pages get one goal, minimal navigation and message match with the ad or email.)
- **Services or products to feature,** in priority order, and the areas they serve (for local SEO). Ask it together with round 1's "what are we building".
- **Lead qualification and booking:** what the business must know before replying (these become the steps of the conversational form), their response-time promise, and whether they use a booking tool. Ask it together with round 3's lead question.

**Assume and state in the playback** (the user corrects in one line):
- **Content they can supply** (case studies, portfolio, team photos, certifications, FAQs, press): ask for it as part of round 1's "what exists already".
- **Pricing:** "from" prices if they shared any, otherwise "on request" with the reason shown.
- **Blog or resources:** none at launch unless someone will write regularly; the structure allows adding one later.

### Think like a strategist
Before the sitemap and presets, read the matching playbook in `references/site-playbooks.md`: what the visitor is really asking, which conversion matters, which pages, sections and trust signals this kind of business needs, the schema type, the SEO angle and the usual mistakes. Then use `references/page-anatomy.md` to plan the homepage narrative (hero → proof → problem → how it works → benefits → social proof → offer → FAQ → final CTA) and each page template. Tell the user briefly *why* the structure is what it is; it builds trust in your choices.

### Preset archetypes for standard sites
Pick five that suit the brief and differ strongly (see `references/core/presets.md` for the axes), and adapt them; never use them as fixed templates:
1. **Product Stage:** headline and CTA set wide across the top, then the product, the work or the place as a large visual directly below, running edge to edge; logo band, editorial benefit rows, precise shapes. Suits SaaS, professional services and agencies.
2. **Statement:** an oversized headline across the full width (grotesk or expressive serif), two CTAs, then sections in their own color worlds. Suits bold consumer brands and launches.
3. **Immersive Editorial:** full-bleed photo or video hero with overlaid headline, a sticky split-scroll of numbered benefits, thin rules, square shapes. Suits wellness, hospitality and premium products.
4. **Bento Proof:** compact hero, then a bento grid of capability tiles with UI fragments, often dark. Suits tech, agencies and B2B.
5. **Human and Warm:** brand-color field hero with a collage of real people, soft shapes, testimonials early. Suits community, health, education and non-profits.
6. **Guided Start:** form-first, with the first question of the lead form in the hero as chips. Suits local services and lead-generation campaigns.
7. **Editorial Story:** magazine layout, serif display, long-form narrative, pull quotes. Suits personal brands, consultancies and craft businesses.
8. **Local Clarity:** trust bar (rating, phone, hours), service cards, service-area map and a sticky mobile call/WhatsApp bar. Suits trades and clinics.

**What each preset shows:** the homepage with header and mobile navigation, the hero, the proof band, three to five core sections in the planned order, the first two steps of the conversational form, the final CTA and the footer. Use real draft copy from the brief and keyword plan. Every preset uses the full width (no centred container), at most one has a copy-beside-image split hero, and none shows a breadcrumb trail (`references/core/design-language.md`, sections 5 and 7).

### Build notes
- **Sitemap and templates:** build every page in `design/seo-plan.md` from the templates in `references/page-anatomy.md`. Prerender everything except routes with an action (contact) and pages with per-request data.
- **Lead capture:** use the starter's `StepForm` and `LeadForm` (`references/core/forms.md`). Define the form once and use it on the contact page and in final CTA sections, pre-selecting the service on service pages. Configure delivery (D1 plus email or webhook), Turnstile keys and the response-time promise, and test it end to end.
- **Contact paths:** phone (`tel:`), WhatsApp (`wa.me` with a prefilled message) and email, consistent everywhere through `app/lib/site.ts`. On mobile, consider a sticky action bar after the hero.
- **Local businesses:** a specific `LocalBusiness` schema with hours and geo, consistent NAP, a click-to-load map, and Google Business Profile in the handover.
- **Content marketing (if agreed):** articles as Markdown or MDX in the repo (or a headless CMS) rendered to prerendered pages with `Article` schema, author and dates. Link each article to the relevant service page.
- **Campaign pages:** no navigation or a minimal one, UTM parameters carried into the lead (hidden fields), `noindex` if temporary or duplicated.
- **Analytics:** Cloudflare Web Analytics (add the beacon snippet manually on Workers) or the user's tool, deferred, with lead events. Handle consent where required.

### Definition of done (in addition to `references/core/quality.md`)
- [ ] The primary CTA is visible in the first viewport on mobile and desktop and repeated at the end of every long page.
- [ ] The lead form is tested end to end: validation, success message with next steps, delivery to the agreed destination.
- [ ] Every page in the SEO plan exists with its planned title, description, H1 and schema.
- [ ] Contact details are identical everywhere and come from `app/lib/site.ts`.
- [ ] The homepage tells the full story (page-anatomy arc) without unanswered visitor questions.
