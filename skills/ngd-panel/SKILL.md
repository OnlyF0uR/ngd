---
name: ngd-panel
description: Next-generation design (NGD) workflow for admin panels, dashboards, back-offices, internal tools, customer portals and account areas, the logged-in and non-indexed interfaces that must feel fast and effortless every day. Interviews the user (theme color or three proposed options, imagery, animations, users and roles, auth, data sources, key tasks and metrics), shows five skeleton app-shell presets in one HTML file to choose from, then builds the chosen design with the latest React Router on Cloudflare Workers, CSS Modules, a server-rendered shell with lazily streamed data behind skeletons, server-side auth and permissions, and accessible tables and forms. Use it whenever someone wants an admin panel, dashboard, CMS or back-office screens, a user or customer portal, members area, account pages or an internal tool, even if they just ask for a backend for their site or a place where customers log in. Combine with ngd-standard or ngd-webstore when the panel belongs to a public site or shop.
---

# NGD Panel: admin and user panels

You are designing and building a logged-in interface: an admin panel, a back-office tool, a customer portal or an account area. People will use it repeatedly, so it must be fast, predictable and pleasant: the shell appears instantly, data streams in behind skeletons, every action confirms itself, and nothing gets in the way of the work. This skill gives you the shared NGD process plus what's specific to panels.

**Non-negotiables, and why they matter:**
- **The user decides the look:** theme color, light/dark, motion and imagery. In panels the brand stays in the accents and the furniture stays calm.
- **Five presets before production code,** showing the app shell, the dashboard and a list view, because structure and density decide how a panel feels in daily use.
- **Latest React Router in framework mode on Cloudflare Workers.** The shell is server-rendered; data never blocks it. Slow data streams in with skeletons that match the final layout, heavy widgets are lazy-loaded, and navigations keep the current screen visible.
- **Security on the server:** authentication in middleware, permission checks in every loader and action, tenant scoping on every query.
- **Not indexed, not cached:** `noindex` headers, robots disallow, `Cache-Control: private, no-store`.
- **CSS Modules per component and page, plus a small `global.css`,** sharing tokens and primitives with the public site when there is one. Shared code is extracted: one table, one form-field set, one skeleton system.
- **Accessible and keyboard-friendly (WCAG 2.2 AA):** power users and assistive-technology users both depend on it.

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
| 4. Foundation | latest React Router on Cloudflare Workers, tokens, global layer, layout, SEO plumbing | `references/core/architecture.md`, `assets/starter/` |
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

## What's specific to panels

### Phase differences
- **Discovery (phase 1):** for a panel on its own, the site questions in round 1 (visitor action, proof, competitors, sitemap, leads, legal pages) don't apply; the questions below replace them. Recommend no scroll animations (people work in panels, they don't scroll through a story) and at most a subtle entrance on first load; motion lives in micro-interactions, skeleton shimmer and quick route transitions. If the public site exists elsewhere, take its colors, fonts (from its CSS) and logo; if you can't reach them, ask for the logo and brand color, and propose fonts in the presets as an assumption.
- **Research (phase 2):** skip keyword research; panels aren't indexed. Instead, research the domain: the objects (customers, orders, invoices…), the 3–5 most frequent tasks, the numbers people check, and how comparable tools structure them. Write a short `design/panel-plan.md` with these headings: users and roles (per audience) · objects · top tasks · screens and routes · navigation per audience · dashboard contents · data sources and freshness · states to design (loading, empty, error, permission denied). Share a five-line summary with the user, like the SEO summary for sites.
- **Presets (phase 3):** if a public site or store is part of the project, its chosen direction comes first; the panel presets inherit its tokens and typography and vary the shell structure, density and component styling. The "one preset that leads with conversion" rule becomes "one that leads with the top task".

### Extra discovery questions
Merge these into the core rounds; a short fourth round for roles and data is fine. Skip whatever the request already answers. For a panel, the theme color usually comes from the public site; ask about it only when there is none.

**Ask:**
- **Who uses it:** internal admins, customers, or both? How many users, which roles, and what may each role see and do?
- **Sign-in:** existing identity provider or SSO? Social login, email codes or passwords? MFA for admins? For a small internal team, suggest Cloudflare Access (no auth code to maintain).
- **Data:** where does it come from (an existing API or database, a commerce platform, D1 built for this panel)? How much (rows) and how fresh (real-time needed)?
- **Objects and top tasks:** the 3–5 things people do most. They become the navigation and the dashboard's "needs attention" area. Ask with the numbers that matter: which KPIs, compared with which period?
- **Devices:** mostly desktop, or also on the phone (which tasks)?

**Assume and state in the playback** (the user corrects in one line):
- **Locale:** the language, currency, date and number formats of the business's country (the draft data in the presets uses them).
- **Organisations or teams:** a single organisation unless they mentioned customers' teams or invitations.
- **Notifications, exports and audit:** email for the events that need action, CSV export on every list, an audit trail of admin changes, data export and deletion on request (GDPR).
- **Density and mode:** comfortable density (compact for data-heavy internal tools); light and dark following the system setting.
- **Brand:** the public site's tokens and typography, applied more calmly.
### Read before designing and building
- `references/panel-ux.md`: app shell, navigation, page anatomy, dashboards, tables, detail views, forms, feedback, empty states, charts, settings, user vs admin panels, density, keyboard and command palette, accessibility, mobile.
- `references/panel-architecture.md`: where the panel lives, authentication options, authorization and tenancy, data access, the shell-first streaming pattern with skeletons, URL-driven tables, mutations with optimistic UI, real-time, errors, security, no-index/no-cache, testing.

### Preset archetypes for panels
Pick five that suit the users and tasks and that differ strongly (`references/core/presets.md`):
1. **Classic Sidebar:** a fixed sidebar, a top bar with search, KPI cards and a table with balanced density. A safe default for most admin panels.
2. **Icon Rail + Context:** a slim icon rail plus a contextual second column (lists, folders, filters) next to the content. Suits CRM, mail, support and content tools.
3. **Top-Nav Portal:** horizontal navigation, centred content, generous spacing, friendly empty states. Suits customer portals and account areas.
4. **Inbox Split:** list and detail side by side, keyboard-first, with the command palette front and centre. Suits operations, moderation and support queues.
5. **Bento Overview:** rounded inset surfaces and a dashboard of widgets in a bento grid, warm and visual. Suits consumer-facing apps and analytics.
6. **Dense Workbench:** compact tables, a filter bar with saved views and multiple panes. Suits power users and back-office operations.

**What each preset shows:** the app shell (desktop sidebar or top nav, plus the mobile navigation), the dashboard (attention area, KPI cards, a chart placeholder, recent activity), and a list view (toolbar with search and filter chips, a table with status pills and a selected row, and the record's detail in an open drawer, or in the detail pane for split layouts). **Two audiences** (a customer portal plus a back office, `references/panel-ux.md` section 12): show the customer home at phone size, then the staff dashboard and list, in each preset, and keep each screen lighter so the file stays lean. Keep the draft data identical across presets; generating the `pN.html` files from one small data module with a script is fine. Include one **skeleton loading state** and one **empty state** somewhere in each preset, so the user sees how waiting and starting feel. Show each screen as its own part (`<div class="ngd-part" data-part="Installations list"></div>` before it), so the screenshot script captures every screen. Use realistic domain data from the brief, not "Lorem" or "Item 1".

### Build notes
- **Structure:** a panel layout route with auth middleware, `noindex` and `private, no-store` headers, and the shell. Each page follows the page anatomy (header, toolbar, content, optional drawer).
- **Shared panel components** (each with its own `.module.css`): `AppShell`, `SidebarNav`, `PageHeader`, `DataTable` (sorting, selection, empty, loading and error states), `FilterBar`, `Drawer` (`<dialog>`-based), `Field`/`Form` primitives, `Toast` (live region), `Skeleton`, `KpiCard`, `StatusPill`, `EmptyState`, `CommandPalette` (if in scope).
- **Data:** shell-first loading with streamed promises and matching skeletons; URL-driven table state; `useFetcher` mutations with optimistic UI; lazy-loaded charts and editors (`references/panel-architecture.md`).
- **Security:** a server-side permission check in every loader and action, tenant scoping, validated inputs, audit log for admin actions, rate-limited sign-in.
- **Starter:** reuse the starter's `root.tsx` (theme script for the light/dark toggle), `global.css`, `cloudflare-context.ts` and `Button`. The public-site components (header, footer, lead form) are only needed if there is a public site.

### Definition of done (in addition to `references/core/quality.md`)
- [ ] The shell renders without waiting for data; every data region has a matching skeleton and its own error state; navigations keep the previous screen visible.
- [ ] Authentication and authorization are enforced on the server for every loader and action; tenant scoping is verified with a second test account.
- [ ] Panel responses carry `noindex` and `Cache-Control: private, no-store`; robots.txt disallows the panel prefix.
- [ ] Tables: server-side pagination, sorting and filtering in the URL, with bulk actions, empty and no-result states.
- [ ] Forms: server validation with inline errors, an unsaved-changes guard, clear saving and success feedback, undo for reversible actions.
- [ ] Keyboard paths work (navigation, tables, dialogs, command palette if built); light and dark modes are both reviewed.
- [ ] Critical flows have Playwright smoke tests (login, list → detail → edit → save, permission denied).
