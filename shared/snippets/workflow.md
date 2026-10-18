## The NGD workflow (shared by every ngd skill)

Work through the phases in order. Each one ends with something the user can see or approve, so they stay in control and nothing gets built on a guess.

**Paths.** `references/…` and `assets/…` are files in this skill's directory (`<skill-dir>`, shown as the base directory when the skill loads; `${CLAUDE_SKILL_DIR}` in Claude Code). Run the helper scripts from the **project folder** with their full path, `node <skill-dir>/scripts/<script>.mjs …`, so that their output (`design/…`, `app/…`) lands in the project, never in the skill's directory.

| Phase | You produce | Read |
|---|---|---|
| 0. Orient | what exists, which tools and environment you have, which ngd skills apply | this section |
| 1. Discover | interview answers → `DESIGN.md` | `references/core/discovery.md` |
| 2. Research | keyword plan + competitor notes → `design/seo-plan.md` | `references/core/seo.md` |
| 3. Presets | five skeleton directions in one HTML file; the user picks | `references/core/presets.md`, `references/core/design-language.md`; for the draft copy, form and motion idea also `copywriting.md`, `forms.md`, `motion.md` and `imagery.md` in `references/core/` |
| 4. Foundation | latest React Router on Cloudflare Workers, tokens, global layer, layout, SEO plumbing | `references/core/architecture.md`, `assets/starter/` |
| 5. Build | every page or screen with real content, forms, images, motion | this skill's references, plus `references/core/` forms, copywriting, imagery and motion |
| 6. Verify | checks pass, screenshots reviewed, fixes made | `references/core/quality.md` |
| 7. Hand over | run/deploy instructions and what's left for the user | `references/core/quality.md` |

### Phase 0: orient (before your first question)
- **Resume if possible.** If `DESIGN.md` exists in the project root, read it, tell the user where things stand, and continue from its *Next step* instead of interviewing again.
- **Look at what exists:** an existing codebase (package.json, React Router and Wrangler config), a live site to replace (fetch it: content, structure, URLs that need redirects), brand assets, and any images the user supplied. Reference images outrank the default style: save image files to `design/references/`; for images pasted into the conversation, analyse what you see directly (`references/core/design-language.md`, section 12) and ask for the files only if they're needed in the project.
- **Inventory your tools**, because they change what you can offer: structured questions (such as AskUserQuestion), web search and fetch (keyword research), image generation (any connected tool that creates images), a browser or Playwright (screenshots), a way to show HTML (artifact or preview). Never offer what you can't do.
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
