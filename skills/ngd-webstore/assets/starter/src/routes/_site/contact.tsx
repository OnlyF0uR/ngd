import { createFileRoute } from '@tanstack/react-router';
import { setResponseStatus } from '@tanstack/react-start/server';
import { seo, breadcrumbJsonLd } from '~/lib/seo';
import { site, telHref, whatsappHref } from '~/lib/site';
import { handleLeadSubmission } from '~/lib/leads.server';
import { LeadForm } from '~/components/forms/LeadForm';
import type { LeadActionData } from '~/components/forms/StepForm/StepForm';
import styles from './contact.module.css';

/*
 * Has a POST handler, so it is server-rendered (never prerendered: static paths reject POST).
 * Every lead form on the site posts here:
 * - with JavaScript, StepForm sends `Accept: application/json` and gets the result as JSON;
 * - without JavaScript, the browser posts the form and gets this page back, re-rendered with the
 *   result (errors next to the fields, or the success message): `next()` falls through to the page
 *   and the loader reads the result from `serverContext`.
 */
export const Route = createFileRoute('/_site/contact')({
  server: {
    handlers: {
      POST: async ({ request, next }) => {
        const { status, result } = await handleLeadSubmission(request);
        if (request.headers.get('Accept')?.includes('application/json')) return Response.json(result, { status });
        setResponseStatus(status);
        return next({ context: { leadResult: result } });
      },
    },
  },
  loader: ({ serverContext }) => ({
    leadResult: (serverContext as { leadResult?: LeadActionData } | undefined)?.leadResult ?? null,
  }),
  head: () =>
    seo({
      title: `Contact | ${site.name}`,
      description: `Tell us what you need and we’ll reply within one working day. Or call ${site.contact.phone}.`,
      path: '/contact',
      jsonLd: breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
    }),
  component: Contact,
});

function Contact() {
  const { leadResult } = Route.useLoaderData();
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
      <LeadForm serverResult={leadResult} />
    </section>
  );
}
