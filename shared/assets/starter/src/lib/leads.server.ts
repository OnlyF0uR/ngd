/**
 * Lead handling: validation, storage and notification. A lead counts as received only when it
 * reached at least one destination: stored in D1, or (without D1) delivered by email or webhook.
 * Bindings are optional here so the starter runs before they exist; declare the ones you use in
 * wrangler.jsonc and run `npm run cf-typegen`.
 */
import { env, waitUntil } from 'cloudflare:workers';
import type { LeadActionData } from '~/components/forms/StepForm/StepForm';
import { site } from './site';
import { verifyTurnstile } from './turnstile.server';

export type Lead = {
  name: string;
  email: string;
  phone?: string;
  /** Every other answered question, by field name (including source page and utm_* parameters) */
  answers: Record<string, string | string[]>;
  source?: string;
};

// Secrets and optional bindings. Typed here (not only via `wrangler types`) because .dev.vars is
// git-ignored, so CI typechecks wouldn't see secrets that only exist there.
type LeadBindings = {
  TURNSTILE_SECRET_KEY?: string;
  DB?: D1Database;
  EMAIL?: SendEmail;
  LEAD_LIMITER?: RateLimit;
  LEAD_NOTIFY_TO?: string;
  LEAD_NOTIFY_FROM?: string;
  LEAD_WEBHOOK_URL?: string;
};

export const leadBindings = () => env as Env & LeadBindings;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED = new Set(['name', 'email', 'phone', 'source', 'ngd_hp', 'cf-turnstile-response']);

/** Server-side validation. Never trust the browser, even though the form validates too. */
export function parseLead(form: FormData): { lead: Lead; errors?: undefined } | { lead?: undefined; errors: Record<string, string> } {
  const text = (key: string, max = 200) =>
    String(form.get(key) ?? '')
      .trim()
      .slice(0, max);
  const errors: Record<string, string> = {};

  const name = text('name');
  const email = text('email', 254).toLowerCase();
  const phone = text('phone', 40);
  if (!name) errors.name = 'Add your name so we know who to reply to';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Add an email address so we can reply';

  const answers: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    if (RESERVED.has(key)) continue;
    const values = form
      .getAll(key)
      .map((v) => String(v).trim().slice(0, 2000))
      .filter(Boolean);
    if (values.length) answers[key.slice(0, 64)] = values.length === 1 ? values[0]! : values;
  }

  if (Object.keys(errors).length) return { errors };
  return { lead: { name, email, phone: phone || undefined, answers, source: text('source', 300) || undefined } };
}

/** Is any destination configured? Without one, submissions must not pretend to succeed. */
export function hasLeadDestination() {
  const b = leadBindings();
  return Boolean(b.DB || (b.EMAIL && b.LEAD_NOTIFY_TO && b.LEAD_NOTIFY_FROM) || b.LEAD_WEBHOOK_URL);
}

/**
 * Store first (durable), then notify after the response. Without D1, the notification itself must
 * succeed before the visitor sees "thanks". Throws when the lead reached no destination.
 */
export async function deliverLead(lead: Lead) {
  const { DB } = leadBindings();
  if (DB) {
    await DB.prepare('INSERT INTO leads (name, email, phone, answers, source_path) VALUES (?, ?, ?, ?, ?)')
      .bind(lead.name, lead.email, lead.phone ?? null, JSON.stringify(lead.answers), lead.source ?? null)
      .run();
    waitUntil(notifyOwner(lead));
    return;
  }
  const delivered = await notifyOwner(lead);
  if (delivered === 0) throw new Error('Lead reached no destination (no D1, and email/webhook delivery failed or is not configured)');
}

/** Email (Cloudflare Email Service) and/or CRM/automation webhook. Returns how many channels succeeded. */
export async function notifyOwner(lead: Lead): Promise<number> {
  const { EMAIL, LEAD_NOTIFY_TO, LEAD_NOTIFY_FROM, LEAD_WEBHOOK_URL } = leadBindings();
  const lines = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone ? `Phone: ${lead.phone}` : '',
    ...Object.entries(lead.answers).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`),
    lead.source ? `Page: ${site.url}${lead.source}` : '',
  ].filter(Boolean);

  const tasks: Promise<unknown>[] = [];
  if (EMAIL && LEAD_NOTIFY_TO && LEAD_NOTIFY_FROM) {
    tasks.push(
      EMAIL.send({
        from: { name: site.name, email: LEAD_NOTIFY_FROM },
        to: LEAD_NOTIFY_TO,
        replyTo: lead.email,
        subject: `New enquiry from ${lead.name}`,
        text: lines.join('\n'),
      }),
    );
  }
  if (LEAD_WEBHOOK_URL) {
    tasks.push(
      fetch(LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) }).then(
        (res) => {
          if (!res.ok) throw new Error(`Webhook answered ${res.status}`);
        },
      ),
    );
  }
  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === 'rejected') console.error('Lead notification failed', r.reason);
  return results.filter((r) => r.status === 'fulfilled').length;
}

/** Approximate per-key limit (per Cloudflare location). Good enough to stop form spam bursts. */
export async function withinRateLimit(key: string) {
  const { LEAD_LIMITER } = leadBindings();
  if (!LEAD_LIMITER) return true;
  const { success } = await LEAD_LIMITER.limit({ key });
  return success;
}

/**
 * The whole submission: honeypot, rate limit, validation, Turnstile, delivery. Used by the POST
 * handler of /contact for both the JavaScript (JSON) and the no-JavaScript (re-rendered page) path.
 */
export async function handleLeadSubmission(request: Request): Promise<{ status: number; result: LeadActionData }> {
  const ok = { status: 200, result: { ok: true } };
  const fail = (status: number, errors: Record<string, string>) => ({ status, result: { ok: false, errors } });
  const fallback = `Please email us at ${site.contact.email} or call ${site.contact.phone}.`;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, { form: `We couldn’t read the form. ${fallback}` });
  }

  // Honeypot filled: pretend success so bots learn nothing.
  if (form.get('ngd_hp')) return ok;

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await withinRateLimit(`lead:${ip}`))) return fail(429, { form: 'Too many attempts. Please wait a minute and try again.' });

  const parsed = parseLead(form);
  if (parsed.errors) return fail(400, parsed.errors);

  // Turnstile is on when the site has a site key; then a missing secret is a configuration error (fail closed).
  if (site.turnstileSiteKey) {
    const secret = leadBindings().TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error('TURNSTILE_SECRET_KEY is not set while site.turnstileSiteKey is: refusing leads (fail closed).');
      return fail(503, { form: `We can’t take messages through this form right now. ${fallback}` });
    }
    const human = await verifyTurnstile({ token: form.get('cf-turnstile-response'), secret, ip });
    if (!human) return fail(400, { form: `We couldn’t verify the request. Please try again. ${fallback}` });
  }

  // Never show "thanks" for a lead that went nowhere.
  if (!hasLeadDestination()) {
    if (import.meta.env.DEV) {
      console.warn('[dev] Lead accepted but not stored: configure DB (D1), EMAIL or LEAD_WEBHOOK_URL.', parsed.lead);
      return ok;
    }
    console.error('No lead destination configured (DB, EMAIL or LEAD_WEBHOOK_URL): refusing leads.');
    return fail(503, { form: `We can’t take messages through this form right now. ${fallback}` });
  }

  try {
    await deliverLead(parsed.lead);
  } catch (error) {
    console.error('Lead delivery failed', error);
    return fail(500, {
      form: `Something went wrong on our side. Your answers are still here: try again, or email us at ${site.contact.email} or call ${site.contact.phone}.`,
    });
  }
  return ok;
}
