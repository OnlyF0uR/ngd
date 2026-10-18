# Forms and lead capture

A lead form is where a website earns its keep. Most contact forms fail because they look like paperwork: eight empty boxes and a "Submit" button. NGD forms feel like a short conversation: one question at a time, easy choices first, personal details last, instant feedback, and a clear "what happens next".

## Contents
1. The conversational lead form
2. Designing the questions
3. Interaction details
4. Implementation (React Router, progressive enhancement)
5. Server side: validation, spam, delivery
6. Other lead paths
7. Privacy and compliance
8. Measuring
9. Forms inside panels

## 1. The conversational lead form

**Why it works:** each step asks for little, so starting feels effortless (and once people have started, they tend to finish). Choice chips are faster than typing and qualify the lead for the business. Personal details come last, once the visitor has invested a little and the value of continuing is clear.

**What the evidence says, so you don't overdo it:** the *number of fields* hurts completion far more than the number of steps, so the conversational format is not a licence to ask more. Usability research supports "one thing per page" for clarity and fewer errors; the dramatic uplift percentages quoted for multi-step forms are vendor anecdotes. Keep the total question count minimal and measure drop-off per step after launch (section 8).

**Shape:** 3–6 steps, each with one question (or one tight group, like name + email):
1. **The easy, relevant opener**: what they need, as tappable chips ("Back pain", "Sports injury", "Post-surgery rehab", "Something else").
2. **Qualification**: one or two questions the business needs to prioritise (timeline, budget range, size of the project, location), again as chips where possible.
3. **Details (optional)**: a free-text "anything we should know?" with a helpful example in the hint, not the placeholder.
4. **Contact**: name, then email and/or phone, plus the preferred contact method if it matters.
5. **Review and consent (only if needed)**: a short summary, the privacy note, and the submit button with a value-driven label ("Request my free assessment").

Then a **success state that continues the conversation**: confirm what happens next and when ("We'll call you within one working day"), offer the next step (book a time right now, read a relevant case study, follow on Instagram), and set expectations about the reply.

Where to put it: the dedicated contact page, a final CTA section on most pages, and, for conversion-first designs, the first step inside or right under the hero ("What do you need help with?" + chips). A sticky mobile CTA can open the same flow in a sheet.

## 2. Designing the questions

- Ask only what the business uses. Every extra field costs leads; for each question, know what decision it drives.
- Use the customer's words for options (from reviews, forums and research), not internal jargon.
- Always offer an escape option ("Something else", "Not sure yet") so nobody gets stuck.
- Budget questions: offer ranges, include "Not sure yet", and explain why you ask ("So we can suggest the right package").
- Phone numbers only when the business really calls back, and say so.
- One language register throughout (formal or informal, as decided in discovery).

## 3. Interaction details

- **One step visible at a time**, with a simple "Step 2 of 4" (a thin bar alongside is fine). Progress that feels quick early on helps, and slow-feeling progress hurts, which is another reason to start with the easiest question. Show the time cost up front when it's low: "Takes about 30 seconds".
- **Enter advances** to the next step from a text field. Single-choice chips can auto-advance after a short (≈180ms) highlight when chosen with a mouse or finger, which feels responsive; keyboard users move through radio options with the arrow keys, which also changes the selection, so for them nothing advances until they press Enter or Continue (otherwise the form would jump away on the first arrow press). Multi-select steps always need an explicit Continue.
- **Back never loses answers.**
- **Translate the interface text** (step counter, Continue, Back, Sending…, error and verification notices) for non-English sites: `StepForm` takes a `labels` prop, fed from `site.ui.form`.
- **Validate per step**, on Continue and when a field loses focus, with specific, kind messages next to the field ("Add an email so we can reply", not "Invalid input"). Never validate while someone is still typing their first attempt; clear the error the moment it's fixed.
- **Mark optional fields "(optional)"** and keep required fields unmarked. Pick that one convention and use it everywhere.
- **Labels above fields**, always visible. Placeholders are for examples, not labels.
- **Right keyboards and autofill:** `type="email"`, `type="tel"` with `inputmode="tel"`, `autocomplete="name"`, `"email"`, `"tel"`, `"organization"`, `"postal-code"`.
- **Big targets:** inputs and chips at least 48px tall; chips are real radio or checkbox inputs styled as chips, so keyboard and screen-reader behaviour comes for free.
- **Focus management:** when the step changes, move focus to the new step's heading (or its first field) and announce the step through a polite live region.
- **Submitting:** disable the button, show "Sending…" in place, keep the layout stable. If sending fails, keep every answer and offer an alternative (email address or phone number) in the error message.
- **Persist on reload (optional):** keeping answers in `sessionStorage` for the session is a nice touch; never store them longer without consent.

## 4. Implementation (React Router, progressive enhancement)

The starter in `assets/starter/app/components/forms/` (`StepForm/` plus the site's `LeadForm.tsx`) implements all of the above and was tested in a browser end to end. Copy it and restyle it to the chosen preset. How it works, so you can adapt it:

- **One real form with one `<fieldset>` per step**, all server-rendered. It is a `fetcher.Form` posting to the route that owns the `action` (usually `/contact`), so the same form can sit on any page and show its success state in place. Without JavaScript, every step is visible as a normal form and the browser posts to that route, which renders the success state. (Exception: with Turnstile enabled, a visitor without JavaScript can't obtain a token; the starter refuses that submission with an email/phone alternative in the message. If those leads matter, store unverified submissions with a flag and skip the notification instead.)
- **The action route is never prerendered.** Prerendered pages are served as static files, and a POST to them returns 405 without reaching your code. Prerender the marketing pages, keep `/contact` (or whichever route has the `action`) server-rendered, and point every embedded form at it.
- **Step mode starts before hydration:** `@media (scripting: enabled)` hides inactive steps (`fieldset:not([data-active])`), so there's no flash of the full form while the JavaScript loads. A class added after hydration applies the same rule in browsers without that media feature.
- **Navigation buttons are `type="button"`**; only the final button submits. Native constraint attributes (`required`, `type`, `pattern`, `minlength`) do the validating: `checkValidity()` on the current fieldset's controls before advancing.
- **`noValidate` is switched on after hydration** so the browser doesn't try to validate hidden steps on submit; the component validates every step itself and jumps to the first incomplete one.
- **Server errors** come back from the action as `{ ok: false, errors: { fieldName: message } }`. The component jumps to the step containing the first failing field and shows the message inline.
- **Attribution:** the form sends the page it was submitted from (`source`) and any `utm_*` parameters as hidden fields, so every lead shows which page and campaign produced it. The UTM fields render only after hydration, because prerendered HTML never contains the query string (rendering them on the server would cause hydration mismatches).
- **Success:** the action returns `{ ok: true }` and the component swaps to the success state, or the action `redirect`s to a `/thank-you` page (noindex) if you track conversions by URL.

## 5. Server side: validation, spam, delivery

In the route `action` (React Router v8 with the typed Cloudflare context from architecture.md; the starter's `app/routes/contact.tsx` is a complete version):

```ts
export async function action({ request, context }: Route.ActionArgs) {
  const { env, ctx } = context.get(cloudflareContext);
  const form = await request.formData();

  // 1. Honeypot: a hidden field humans never fill (neutral name, so browsers don't autofill it). Pretend success so bots learn nothing.
  if (form.get('ngd_hp')) return { ok: true };

  // 2. Validate on the server too: never trust the browser.
  const { values, errors } = parseLead(form); // your schema (hand-written or a small validator library)
  if (errors) return data({ ok: false, errors }, { status: 400 });

  // 3. Bot check + rate limit.
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (site.turnstileSiteKey) {
    const secret = leadBindings(env).TURNSTILE_SECRET_KEY;
    if (!secret) return data({ ok: false, errors: { form: 'Form unavailable, please email us.' } }, { status: 503 }); // fail closed
    if (!(await verifyTurnstile({ token: form.get('cf-turnstile-response'), secret, ip }))) {
      return data({ ok: false, errors: { form: 'Please confirm you are human and try again.' } }, { status: 400 });
    }
  }

  // 4. Deliver: the lead must reach a destination before you report success.
  if (!hasLeadDestination(env)) return data({ ok: false, errors: { form: 'Form unavailable, please email us.' } }, { status: 503 });
  await deliverLead(env, ctx, values);          // D1 first (then email/webhook after the response), or email/webhook awaited
  return { ok: true };
}
```

- **Spam protection, layered:** honeypot field + Cloudflare Turnstile (server-side verification with the secret key) + a per-IP rate limit + server validation. The public site key lives in `app/lib/site.ts`, so forms on prerendered pages render the widget too. The script loads only when the last step is reached, so it never slows the first paint, and the form waits for the token before sending. The exact Turnstile, rate-limiting and email bindings are in architecture.md.
- **Delivery options** (decided in discovery): store in D1 (simple, exportable, never lost), notify by email (Cloudflare's email sending, or the email provider the business already uses), forward to a CRM or automation webhook (secret URL in an env var), post to Slack/Teams. Store first, then notify, so a failing notification never loses a lead. Never answer "thanks" for a lead that reached no destination: the starter refuses submissions in production until a destination is configured, and shows the email/phone fallback instead.
- **Idempotency:** disable double submits on the client; on the server, ignore an identical submission from the same IP within a few seconds.
- **Never put secrets in client code.** Site keys are public; secret keys live in Worker secrets (`wrangler secret put`), and in `.dev.vars` locally (git-ignored).

## 6. Other lead paths

Offer more than one way in; different people prefer different channels:
- **Click-to-call** (`tel:` links) and **WhatsApp** deep links with a prefilled message (`https://wa.me/<international number>?text=<url-encoded text>`), especially for local businesses on mobile.
- **Booking:** link to the booking tool, or embed it only after a click ("Pick a time") so its heavy script never loads up front.
- **Lead magnets:** a calculator (price estimate, savings), a checklist or guide download, a quiz that recommends a package. Interactive tools convert well and earn links; render the result on the server too, so it's shareable.
- **Newsletter:** a single email field with a clear promise and frequency; double opt-in where required.
- **Chat widgets:** only if someone actually answers quickly, and loaded on interaction (they're among the heaviest third-party scripts).

## 7. Privacy and compliance

- Collect the minimum. Say why you ask for anything sensitive.
- A short privacy note under the submit button with a link to the privacy policy. Explicit consent checkboxes only where needed (for example newsletter sign-up alongside a contact request), never pre-ticked.
- Don't send personal data to analytics (no emails in URLs or event properties).
- Retention: decide how long leads are kept and document it in the privacy policy.

## 8. Measuring

- Track step views and completion as events, so drop-off per step is visible. That shows which question to cut or reword.
- Track the submit as a conversion (`generate_lead` or the analytics tool's equivalent), or use the `/thank-you` URL.
- Review after launch: if more than about 30% drop at one step, change that step first.

## 9. Forms inside panels

Data-entry forms in admin and user panels follow different rules (ngd-panel covers them in depth): labels left or above in dense grids, inline validation, save states, unsaved-changes guards, keyboard submit, optimistic updates. The shared basics still apply: real labels, helpful errors, correct input types, and never losing what someone typed.
