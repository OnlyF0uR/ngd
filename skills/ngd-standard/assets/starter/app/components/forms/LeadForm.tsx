import { Link } from 'react-router';
import { site } from '~/lib/site';
import { StepForm, Step, Choices, Field } from './StepForm/StepForm';

/**
 * The site's lead form, defined once and used on the contact page and in CTA sections (including
 * prerendered pages: it always posts to the server-rendered /contact action).
 * Adapt the steps to what the business needs to qualify a lead (references/core/forms.md).
 */
export function LeadForm() {
  const privacy = site.legal.find((page) => page.href.includes('privacy'));
  return (
    <StepForm
      action="/contact"
      submitLabel="Send my request"
      timeHint="Takes about 30 seconds"
      turnstileSiteKey={site.turnstileSiteKey}
      labels={site.ui.form}
      success={
        <>
          <h3>Thanks, we’ve got it.</h3>
          <p>We’ll get back to you within one working day. Prefer to talk now? Call us or send a WhatsApp message.</p>
        </>
      }
      footnote={
        <>
          We only use your details to answer your request.{' '}
          {privacy && <Link to={privacy.href}>{privacy.label} policy</Link>}
        </>
      }
    >
      <Step title="What can we help you with?" autoAdvance>
        <Choices name="topic" required options={['First option', 'Second option', 'Third option', 'Something else']} />
      </Step>
      <Step title="When would you like to start?" autoAdvance>
        <Choices name="timing" required options={['As soon as possible', 'Within a month', 'Just exploring']} />
      </Step>
      <Step title="Anything we should know?" hint="Optional, but it helps us prepare.">
        <Field label="Your message" name="message" multiline required={false} hint="For example: what you’ve tried so far" />
      </Step>
      <Step title="How can we reach you?">
        <Field label="Name" name="name" autoComplete="name" errorMessage="Add your name so we know who to reply to" />
        <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" errorMessage="Add an email address so we can reply" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required={false} />
      </Step>
    </StepForm>
  );
}
