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

Work through the phases in order. Each one ends with something the user can see or approve, so they stay in control and nothing gets built on a guess. Paths below are relative to this skill's directory (shown as its base directory when the skill loads).

| Phase | You produce | Read |
|---|---|---|
| 0. Orient | what exists, which tools you have, which ngd skills apply | this section |
| 1. Discover | interview answers → `DESIGN.md` | `references/core/discovery.md` |
| 2. Research | keyword plan + competitor notes → `design/seo-plan.md` | `references/core/seo.md` |
| 3. Presets | five skeleton directions in one HTML file; the user picks | `references/core/presets.md`, `references/core/design-language.md` |
| 4. Foundation | latest React Router on Cloudflare Workers, tokens, global layer, layout, SEO plumbing | `references/core/architecture.md`, `assets/starter/` |
| 5. Build | every page or screen with real content, forms, images, motion | this skill's references, plus `references/core/` forms, copywriting, imagery and motion |
| 6. Verify | checks pass, screenshots reviewed, fixes made | `references/core/quality.md` |
| 7. Hand over | run/deploy instructions and what's left for the user | `references/core/quality.md` |

### Phase 0: orient (before your first question)
- **Resume if possible.** If `DESIGN.md` exists in the project root, read it, tell the user where things stand, and continue from its *Next step* instead of interviewing again.
- **Look at what exists:** an existing codebase (package.json, React Router and Wrangler config), a live site to replace (fetch it: content, structure, URLs that need redirects), brand assets, and any images the user attached. Copy reference images to `design/references/` and analyse them (`references/core/design-language.md`, section 12); they outrank the default style.
- **Inventory your tools**, because they change what you can offer: structured questions (such as AskUserQuestion), web search and fetch (keyword research), image generation (any connected tool that creates images), a browser or Playwright (screenshots), and a way to show HTML (artifact or preview). Never offer what you can't do.
- **Check which ngd skills apply** (see "Working with other ngd skills" below).

### Phase 1: discover
Run the interview in `references/core/discovery.md`, adding this skill's extra questions (below): at most three short rounds, nothing you could infer, and a recommended default for every question. The theme color either comes from the user or is picked from three options you propose and validate with `node scripts/palette.mjs --candidates …`. Ask about images (provided, generated if an image tool is connected, stock, or none, and where to find them) and, separately, entrance and scroll animations. Create `DESIGN.md` from `assets/DESIGN.template.md` and play back a short summary.

### Phase 2: research
For anything that will be indexed, research keywords for the niche, location and language, scan competitors, and map one keyword cluster to each page in `design/seo-plan.md` (`references/core/seo.md`). Share the sitemap and top keywords in a few lines, because it may change what gets built. Panels skip keyword research but still research the domain (typical entities, workflows, metrics).

### Phase 3: five skeleton presets
Build five clearly different directions in ONE file, `design/presets/round-1.html`, from `assets/presets-shell.html`. Use real draft copy and the generated tokens, check the file with `node scripts/screenshot.mjs design/presets/round-1.html --presets`, show it, and ask the user to pick one, mix, tweak, or request five more (`references/core/presets.md`). Write no production code before a direction is chosen. The choice is the user's, and building early wastes their time if they choose differently.

### Phase 4: foundation
Scaffold the latest React Router (framework mode, SSR) on Cloudflare Workers, or upgrade the existing project. Apply the verified starter in `assets/starter/`, generate `app/styles/tokens.css` with `scripts/palette.mjs`, then set up fonts, the small `global.css`, the layout shell, UI primitives and SEO plumbing (`references/core/architecture.md`). Reproduce the chosen preset faithfully: same typography, spacing rhythm, shape language and signature details.

### Phase 5: build
Build every page or screen with this skill's guidance. Server-render (or prerender) every indexed page with complete metadata and structured data. In non-indexed app areas, never block the shell on data: stream or lazy-load it behind skeletons. Extract shared code as you go (a second use becomes a component), keep component and page styles in `.module.css` files, and write real copy (`references/core/copywriting.md`). Lorem ipsum never ships.

### Phase 6: verify
Run everything in `references/core/quality.md`: typecheck, build, `node scripts/ngd-audit.mjs .`, a Worker dry-run, screenshots at 390/768/1440 (plus dark mode if offered), Lighthouse on key pages, and an honest side-by-side review against the chosen preset. Fix what you find, then re-run.

### Phase 7: hand over
Summarise what was built, how to run and deploy it, what needs the user's input (secrets, DNS, content, Search Console), and the verification results. Update DESIGN.md's status.

### Working with other ngd skills
The ngd skills (**ngd-standard** for landing pages and content sites, **ngd-webstore** for shops, **ngd-panel** for admin and user panels) share this workflow and the files in `references/core/`, `scripts/` and `assets/`. Those files are identical in every ngd skill, so read each one once, from whichever skill you loaded first. When a request spans several surfaces (a shop with an admin panel, a marketing site with a customer portal, a brand site with a shop):
- Load every relevant ngd skill and run this workflow **once**: one interview with the extra questions merged, one `DESIGN.md` with a section per surface, one research pass covering all indexed pages, one project and one design system.
- **Presets:** start with the public surface (webstore or standard), because it defines the brand. Once it's chosen, run a second, smaller round for the panel that inherits the chosen tokens and typography and varies the app-shell structure and density. For standard plus webstore, one round whose presets show both a content page and the shop views.
- **Build order:** shared foundation, then the public surface, then the panel.
- If a request clearly needs an ngd skill that isn't installed, say so and apply the closest guidance from the core references.

### When guidance conflicts
1. The user's explicit answers and instructions.
2. Reference images or brand guidelines the user supplied.
3. Existing brand assets (logo, current site), unless the user wants a rebrand.
4. This skill's defaults (design language, preset archetypes).

Theme color, color mode, fonts, motion level and imagery are always the user's decision: this skill tells you how to ask and how to apply the answer, never what the answer is.
<!-- ngd:workflow:end -->

## What's specific to panels

### Phase differences
- **Research (phase 2):** skip keyword research; panels aren't indexed. Instead, research the domain: the objects (customers, orders, invoices…), the 3–5 most frequent tasks, the numbers people check, and how comparable tools structure them. Write a short `design/panel-plan.md`: users and roles, objects, top tasks, screens, navigation and dashboard contents.
- **Presets (phase 3):** if a public site or store is part of the project, its chosen direction comes first; the panel presets inherit its tokens and typography and vary the shell structure, density and component styling.

### Extra discovery questions
Fold these into the interview rounds (skip what you already know):
- **Who uses it:** internal admins, customers, or both? How many users, which roles, and what may each role see and do?
- **Sign-in:** existing identity provider or SSO? Social login, email codes or passwords? MFA for admins? For a small internal team, suggest Cloudflare Access (no auth code to maintain).
- **Data:** where does it come from (an existing API or database, a commerce platform, D1 built for this panel)? How much (rows) and how fresh (real-time needed)?
- **Objects and top tasks:** the 3–5 things people do most. They become the navigation and the dashboard's "needs attention" area.
- **Numbers that matter:** which KPIs, compared with which period?
- **Organisations or teams** (multi-tenant)? Invitations and roles per team?
- **Notifications, exports and audit:** email or in-app notifications, CSV/PDF exports, an audit trail, data export and deletion (GDPR)?
- **Devices:** mostly desktop, or also on the phone (which tasks)?
- **Density and mode:** comfortable or compact; light, dark or both (often both).
- **Brand:** identical to the public site, or calmer and more neutral?

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

**What each preset shows:** the app shell (desktop sidebar or top nav, plus the mobile navigation), the dashboard (attention area, KPI cards, a chart placeholder, recent activity), and a list view (toolbar with search and filter chips, a table with status pills and a selected row, an open detail drawer). Include one **skeleton loading state** and one **empty state** somewhere in each preset, so the user sees how waiting and starting feel. Use realistic domain data from the brief, not "Lorem" or "Item 1".

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
