# NGD: next-generation design skills

Agent skills that turn a request like *"build a website for my physiotherapy practice"* into a site that looks remarkable, loads instantly, ranks, and generates leads. They guide the agent through a short design interview, keyword research, **five skeleton design presets in a single HTML file** to choose from, and then a production build with the latest **React Router** (server-rendered or prerendered) on **Cloudflare Workers**, styled with **CSS Modules**.

| Skill | For | Highlights |
|---|---|---|
| [`ngd-standard`](skills/ngd-standard/SKILL.md) | Landing pages, company, service, portfolio, event and other content sites | Site playbooks per business type, page anatomy, conversational lead form |
| [`ngd-webstore`](skills/ngd-webstore/SKILL.md) | Online stores | Commerce backends, catalogue SEO and product structured data, cart/checkout UX, EU compliance (Omnibus prices, withdrawal function) |
| [`ngd-panel`](skills/ngd-panel/SKILL.md) | Admin panels, dashboards, customer portals, internal tools | Shell-first streaming with skeletons, server-side auth and permissions, tables, forms, command palette |

The skills share one workflow and can be combined: a shop with an admin panel uses `ngd-webstore` + `ngd-panel`, a marketing site with a customer portal uses `ngd-standard` + `ngd-panel`. The agent then runs one interview, one design system and one project.

## How a project runs

1. **Orient:** resume from `DESIGN.md` if it exists; inspect the codebase, existing site, brand assets and the user's example images (which outrank the default style); check which tools are available (questions, web search, image generation, browser).
2. **Discover:** at most three short question rounds with recommended defaults. The theme color comes from the user or from three proposed, contrast-checked options. Images: provided, AI-generated (only if an image tool is connected), stock, or none. Entrance and scroll animations: none, subtle or expressive. Plus goals, audience, proof, pages, lead routing and type-specific questions. Everything lands in `DESIGN.md`.
3. **Research:** keyword research for the niche and location, competitor scan, one keyword cluster per page (`design/seo-plan.md`).
4. **Presets:** five clearly different skeleton directions with real copy and the user's colors in one HTML viewer (tabs, desktop/tablet/mobile, light/dark, notes). The user picks, mixes, tweaks, or asks for five more.
5. **Foundation:** latest React Router + Cloudflare Workers from a verified starter, generated color tokens, a small global stylesheet, CSS Modules everywhere.
6. **Build:** all pages or screens, real copy, the conversational form, images, motion that never delays content.
7. **Verify:** typecheck, build, the NGD audit, Worker dry-run, screenshots at three widths, Lighthouse, and a review against the chosen preset.
8. **Hand over:** run, deploy and launch instructions.

## What's inside each skill

```
skills/<skill>/
├── SKILL.md                 workflow + type-specific guidance
├── references/              type-specific references (playbooks, store UX, panel architecture …)
├── references/core/         shared references: discovery, presets, design language, architecture,
│                            SEO, motion, imagery, forms, copywriting, quality
├── scripts/                 palette.mjs (theme color → accessible tokens), build-presets.mjs
│                            (assembles the presets file), screenshot.mjs, ngd-audit.mjs (project checks)
└── assets/                  presets-shell.html (preset viewer), DESIGN.template.md,
                             starter/ (verified React Router 8 + Cloudflare starter files),
                             starter-panel/ (verified panel add-on: auth layout, shell, streaming, tables)
```

`references/core/`, `scripts/` and `assets/` are identical in every skill. They are generated from [`shared/`](shared/), so each skill folder stays self-contained.

## Install

**Claude Code (plugin):**

```text
/plugin marketplace add OnlyF0uR/ngd
/plugin install ngd@ngd
```

The skills then appear as `/ngd:ngd-standard`, `/ngd:ngd-webstore` and `/ngd:ngd-panel`. Claude also picks them automatically when a request matches. `plugin.json` deliberately has no `version`, so installs track the latest commit. Update with `claude plugin marketplace update ngd && claude plugin update ngd@ngd`, or enable auto-update for the marketplace. If you'd rather publish pinned releases, add a semver `version` and bump it on every release.

**Claude Code (standalone skills):** copy `skills/ngd-standard` (and/or the others) into `~/.claude/skills/` or a project's `.claude/skills/`.

**claude.ai / Claude API:** zip a skill folder (the folder itself at the top level of the zip) and upload it as a custom skill. The frontmatter uses only portable fields.

## Requirements for the projects the skills build

- Node.js 22.22 or newer (React Router 8), npm.
- A Cloudflare account for deployment (Workers; Workers Paid is recommended for SSR-heavy shops and panels).
- Optional: Playwright with Chromium for `screenshot.mjs` (`npm i -D playwright && npx playwright install chromium`), and Lighthouse.

## Maintaining the skills

- Edit shared material only in [`shared/`](shared/): `references/core/`, `scripts/`, `assets/` and `snippets/workflow.md` (the workflow section injected into every SKILL.md between the `ngd:workflow` markers).
- Then run `node scripts/sync-shared.mjs` to copy it into each skill. `node scripts/sync-shared.mjs --check` verifies that everything is in sync and that the frontmatter is portable (name equals the folder, description ≤ 1024 characters, no angle brackets, SKILL.md under 500 lines). Run it before every commit.
- `claude plugin validate .` checks the plugin and marketplace manifests.
- [`evals/`](evals/) holds test prompts per skill with expectations to grade; run them after larger changes (its README explains how).
- The technical facts (React Router 8.4, `@cloudflare/vite-plugin` 1.x, Wrangler 4, browser support, Google Search guidance) were verified in October 2026. The skills tell agents to check the latest versions at build time; refresh `references/core/architecture.md` and the starter when a new major version lands.
- A new ngd skill: create `skills/ngd-<name>/SKILL.md` with frontmatter, an intro, the empty workflow markers and type-specific sections, then run the sync.
