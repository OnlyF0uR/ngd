# Evals

Test prompts for the ngd skills, one `evals.json` per skill (the format the skill-creator workflow uses: `prompt`, `expected_output`, `expectations`). They live outside `skills/` so they aren't packaged with the skills.

| Skill | Cases |
|---|---|
| `ngd-standard` | a local practice with no site yet; a Google Ads landing page with a fixed brand color and reference screenshots; a redesign that must keep its rankings |
| `ngd-webstore` | a coffee roaster with beans, subscriptions and gear; a headless storefront for an existing Shopify shop with a monochrome brand |
| `ngd-panel` | a customer portal plus a back office (two audiences); a small internal leads admin on an existing site |

## Running them

1. Start a fresh agent session with only the skill under test installed (plus its siblings when the case spans surfaces).
2. Give it the prompt. Most cases stop at the presets, so tell the agent to answer its own interview questions with the recommended defaults (or supply answers), and to stop after presenting the five presets.
3. Grade each expectation as passed or failed with evidence from the files it produced (`DESIGN.md`, `design/seo-plan.md` or `design/panel-plan.md`, `design/presets/round-1/` and `round-1.html`, the screenshots) and from the transcript.
4. Read the transcript too: time lost on the skill's own tooling, guidance the agent had to guess, and helper scripts it wrote itself are the most useful signals for the next iteration. Three runs of these cases led to `build-presets.mjs`, the `ngd-` prefixed preset shell, the screenshot file checks and the panel starter.
