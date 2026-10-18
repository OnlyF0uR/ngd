import { data } from 'react-router';
import type { Route } from './+types/contact';
import { seo, breadcrumbJsonLd } from '~/lib/seo';
import { site, telHref, whatsappHref } from '~/lib/site';
import { cloudflareContext } from '~/lib/cloudflare-context';
import { parseLead, saveLead, notifyOwner, withinRateLimit, leadBindings } from '~/lib/leads.server';
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
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
  });

export function loader({ context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  return { turnstileSiteKey: env.TURNSTILE_SITE_KEY };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { env, ctx } = context.get(cloudflareContext);
  const form = await request.formData();

  // Honeypot filled: pretend success so bots learn nothing.
  if (form.get('company_website')) return { ok: true } satisfies LeadActionData;

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await withinRateLimit(env, `lead:${ip}`))) {
    return data<LeadActionData>({ ok: false, errors: { form: 'Too many attempts. Please wait a minute and try again.' } }, { status: 429 });
  }

  const parsed = parseLead(form);
  if (parsed.errors) return data<LeadActionData>({ ok: false, errors: parsed.errors }, { status: 400 });

  const human = await verifyTurnstile(form.get('cf-turnstile-response'), leadBindings(env).TURNSTILE_SECRET_KEY, ip);
  if (!human) {
    return data<LeadActionData>(
      { ok: false, errors: { form: `We couldn’t verify the request. Please try again, or email us at ${site.contact.email}.` } },
      { status: 400 },
    );
  }

  try {
    await saveLead(env, parsed.lead);
  } catch (error) {
    console.error('Saving lead failed', error);
    return data<LeadActionData>(
      { ok: false, errors: { form: `Something went wrong on our side. Your answers are still here; try again or email ${site.contact.email}.` } },
      { status: 500 },
    );
  }
  ctx.waitUntil(notifyOwner(env, parsed.lead));
  return { ok: true } satisfies LeadActionData;
}

export default function Contact({ loaderData }: Route.ComponentProps) {
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
      <LeadForm turnstileSiteKey={loaderData.turnstileSiteKey} />
    </section>
  );
}
