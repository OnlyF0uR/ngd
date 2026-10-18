/**
 * Lead handling: validation, storage and notification. Store first, then notify, so a failing
 * notification never loses a lead. Bindings are optional here so the starter runs before they exist;
 * declare the ones you use in wrangler.jsonc and run `npm run cf-typegen`.
 */
import { site } from './site';

export type Lead = {
  name: string;
  email: string;
  phone?: string;
  /** Every other answered question, by field name */
  answers: Record<string, string | string[]>;
  source?: string;
};

type LeadBindings = {
  DB?: D1Database;
  EMAIL?: SendEmail;
  LEAD_LIMITER?: RateLimit;
  LEAD_NOTIFY_TO?: string;
  LEAD_NOTIFY_FROM?: string;
  LEAD_WEBHOOK_URL?: string;
};

export const leadBindings = (env: Env) => env as Env & LeadBindings;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED = new Set(['name', 'email', 'phone', 'source', 'company_website', 'cf-turnstile-response']);

/** Server-side validation. Never trust the browser, even though the form validates too. */
export function parseLead(form: FormData): { lead: Lead; errors?: undefined } | { lead?: undefined; errors: Record<string, string> } {
  const text = (key: string, max = 200) => String(form.get(key) ?? '').trim().slice(0, max);
  const errors: Record<string, string> = {};

  const name = text('name');
  const email = text('email', 254).toLowerCase();
  const phone = text('phone', 40);
  if (!name) errors.name = 'Add your name so we know who to reply to';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Add an email address so we can reply';

  const answers: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    if (RESERVED.has(key)) continue;
    const values = form.getAll(key).map((v) => String(v).trim().slice(0, 2000)).filter(Boolean);
    if (values.length) answers[key.slice(0, 64)] = values.length === 1 ? values[0]! : values;
  }

  if (Object.keys(errors).length) return { errors };
  return { lead: { name, email, phone: phone || undefined, answers, source: text('source', 300) || undefined } };
}

/** Durable storage in D1 (see migrations/0001_leads.sql). */
export async function saveLead(env: Env, lead: Lead) {
  const { DB } = leadBindings(env);
  if (!DB) return;
  await DB.prepare('INSERT INTO leads (name, email, phone, answers, source_path) VALUES (?, ?, ?, ?, ?)')
    .bind(lead.name, lead.email, lead.phone ?? null, JSON.stringify(lead.answers), lead.source ?? null)
    .run();
}

/** Notify the business: email (Cloudflare Email Service) and/or a CRM or automation webhook. */
export async function notifyOwner(env: Env, lead: Lead) {
  const { EMAIL, LEAD_NOTIFY_TO, LEAD_NOTIFY_FROM, LEAD_WEBHOOK_URL } = leadBindings(env);
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
    tasks.push(fetch(LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) }));
  }
  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === 'rejected') console.error('Lead notification failed', r.reason);
}

/** Approximate per-key limit (per Cloudflare location). Good enough to stop form spam bursts. */
export async function withinRateLimit(env: Env, key: string) {
  const { LEAD_LIMITER } = leadBindings(env);
  if (!LEAD_LIMITER) return true;
  const { success } = await LEAD_LIMITER.limit({ key });
  return success;
}
