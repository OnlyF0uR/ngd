import { data } from 'react-router';
import type { Route } from './+types/contact';
import { seo } from '~/lib/seo';
import { site, telHref, whatsappHref } from '~/lib/site';
import { cloudflareContext } from '~/lib/cloudflare-context';
import { parseLead, deliverLead, hasLeadDestination, leadBindings, withinRateLimit } from '~/lib/leads.server';
import { verifyTurnstile } from '~/lib/turnstile.server';
import { LeadForm } from '~/components/forms/LeadForm';
import type { LeadActionData } from '~/components/forms/StepForm/StepForm';
import styles from './contact.module.css';

// Has an action, so it is server-rendered (never prerendered: static paths reject POST).
export const meta: Route.MetaFunction = () =>
  seo({
    title: `Contact | ${site.name}`,
    description: `Tell us what you need and we’ll reply within one working day. Or call ${site.contact.phone}.`,
    path: '/contact',
  });

const fail = (status: number, errors: Record<string, string>) => data<LeadActionData>({ ok: false, errors }, { status });
const fallback = `Please email us at ${site.contact.email} or call ${site.contact.phone}.`;

export async function action({ request, context }: Route.ActionArgs) {
  const { env, ctx } = context.get(cloudflareContext);
  const form = await request.formData();

  // Honeypot filled: pretend success so bots learn nothing.
  if (form.get('ngd_hp')) return { ok: true } satisfies LeadActionData;

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await withinRateLimit(env, `lead:${ip}`))) {
    return fail(429, { form: 'Too many attempts. Please wait a minute and try again.' });
  }

  const parsed = parseLead(form);
  if (parsed.errors) return fail(400, parsed.errors);

  // Turnstile is on when the site has a site key; then a missing secret is a configuration error (fail closed).
  if (site.turnstileSiteKey) {
    const secret = leadBindings(env).TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error('TURNSTILE_SECRET_KEY is not set while site.turnstileSiteKey is: refusing leads (fail closed).');
      return fail(503, { form: `We can’t take messages through this form right now. ${fallback}` });
    }
    const human = await verifyTurnstile({ token: form.get('cf-turnstile-response'), secret, ip });
    if (!human) return fail(400, { form: `We couldn’t verify the request. Please try again. ${fallback}` });
  }

  // Never show "thanks" for a lead that went nowhere.
  if (!hasLeadDestination(env)) {
    if (import.meta.env.DEV) {
      console.warn('[dev] Lead accepted but not stored: configure DB (D1), EMAIL or LEAD_WEBHOOK_URL.', parsed.lead);
      return { ok: true } satisfies LeadActionData;
    }
    console.error('No lead destination configured (DB, EMAIL or LEAD_WEBHOOK_URL): refusing leads.');
    return fail(503, { form: `We can’t take messages through this form right now. ${fallback}` });
  }

  try {
    await deliverLead(env, ctx, parsed.lead);
  } catch (error) {
    console.error('Lead delivery failed', error);
    return fail(500, { form: `Something went wrong on our side. Your answers are still here: try again, or email us at ${site.contact.email} or call ${site.contact.phone}.` });
  }
  return { ok: true } satisfies LeadActionData;
}

export default function Contact() {
  const { contact } = site;
  return (
    <section className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Let’s talk about what you need</h1>
        <p className={styles.lead}>Answer a few quick questions and we’ll reply within one working day.</p>
        <ul role="list" className={styles.channels}>
          <li>
            <a href={telHref(contact.phone)}>{contact.phone}</a>
          </li>
          <li>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </li>
          {contact.whatsapp && (
            <li>
              <a href={whatsappHref(contact.whatsapp, 'Hi! I have a question about…')} rel="noopener">
                WhatsApp us
              </a>
            </li>
          )}
        </ul>
      </div>
      <LeadForm />
    </section>
  );
}
