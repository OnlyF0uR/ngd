import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useActionData, useFetcher, useLocation } from 'react-router';
import styles from './StepForm.module.css';

/**
 * Conversational lead form: one question per step, choices before personal details,
 * progressive enhancement (works as a normal form without JavaScript), inline errors,
 * keyboard friendly, Turnstile loaded only on the last step. See references/core/forms.md.
 *
 * <StepForm action="/contact" submitLabel="Request my free intake" success={<p>…</p>}>
 *   <Step title="What can we help you with?" autoAdvance>
 *     <Choices name="topic" required options={['Back pain', 'Sports injury', 'Something else']} />
 *   </Step>
 *   <Step title="How can we reach you?">
 *     <Field label="Name" name="name" autoComplete="name" />
 *     <Field label="Email" name="email" type="email" autoComplete="email" errorMessage="Add an email so we can reply" />
 *   </Step>
 * </StepForm>
 */

export type LeadActionData = { ok: boolean; errors?: Record<string, string> };

const ErrorsContext = createContext<Record<string, string>>({});

type StepProps = {
  title: string;
  hint?: ReactNode;
  /** Single-choice steps: advance automatically after a choice is made */
  autoAdvance?: boolean;
  children: ReactNode;
};

/** A step marker; StepForm renders it as a fieldset. */
export function Step(_props: StepProps): null {
  return null;
}

type StepFormProps = {
  /** Route that exports the `action`. Must be server-rendered (prerendered paths reject POST). */
  action?: string;
  submitLabel?: string;
  /** Shown in place of the form after a successful submit: confirm what happens next */
  success: ReactNode;
  /** Small print under the form, e.g. a privacy note with a link */
  footnote?: ReactNode;
  /** "Takes about 30 seconds" */
  timeHint?: string;
  /** Public Turnstile site key; the server verifies the token */
  turnstileSiteKey?: string;
  children: ReactNode;
};

// Structural type: the Workers runtime types redeclare the global `Element`, which breaks DOM generics like HTMLSelectElement.
type Control = HTMLElement & { name: string; validationMessage: string; checkValidity(): boolean };

export function StepForm({ action = '/contact', submitLabel = 'Send', success, footnote, timeHint, turnstileSiteKey, children }: StepFormProps) {
  const fetcher = useFetcher<LeadActionData>();
  const actionData = useActionData() as LeadActionData | undefined; // the no-JavaScript path posts to the page itself
  const location = useLocation();
  const steps = Children.toArray(children).filter((c): c is ReactElement<StepProps> => isValidElement(c) && c.type === Step);
  const last = steps.length - 1;

  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [reachedLast, setReachedLast] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [turnstileReset, setTurnstileReset] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRefs = useRef<(HTMLElement | null)[]>([]);
  const successRef = useRef<HTMLDivElement>(null);

  const result = fetcher.data ?? actionData;
  const serverErrors = result?.errors ?? {};
  const submitting = fetcher.state !== 'idle';

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (index === last) setReachedLast(true);
  }, [index, last]);

  // After a server response: focus the success message, or jump to the step with the first failing field.
  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      successRef.current?.focus();
      return;
    }
    setTurnstileReset((n) => n + 1); // tokens are single-use
    const names = Object.keys(result.errors ?? {});
    const target = stepElements().findIndex((fs) => names.some((n) => fs.querySelector(`[name="${CSS.escape(n)}"]`)));
    if (target >= 0) goTo(target);
  }, [result]);

  function stepElements() {
    return formRef.current ? [...formRef.current.querySelectorAll<HTMLFieldSetElement>('fieldset[data-step]')] : [];
  }

  function controlsOf(i: number): Control[] {
    const fieldset = stepElements()[i];
    return fieldset ? ([...fieldset.querySelectorAll<HTMLElement>('input:not([type=hidden]), textarea, select')] as Control[]) : [];
  }

  function validate(i: number) {
    const found: Record<string, string> = {};
    for (const control of controlsOf(i)) {
      if (!control.checkValidity() && !found[control.name]) found[control.name] = control.dataset.error || control.validationMessage;
    }
    setClientErrors((prev) => {
      const next = { ...prev };
      for (const control of controlsOf(i)) delete next[control.name];
      return { ...next, ...found };
    });
    const first = Object.keys(found)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)?.focus();
    return !first;
  }

  function goTo(i: number) {
    setIndex(i);
    requestAnimationFrame(() => titleRefs.current[i]?.focus());
  }

  const next = () => {
    if (validate(index)) goTo(Math.min(index + 1, last));
  };
  const back = () => goTo(Math.max(index - 1, 0));

  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    // Enter moves forward instead of submitting the whole form early
    if (event.key === 'Enter' && index < last && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      next();
    }
  }

  function onChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement;
    if (target.name) {
      setClientErrors((prev) => {
        if (!(target.name in prev)) return prev;
        const { [target.name]: _removed, ...rest } = prev;
        return rest;
      });
    }
    if (steps[index]?.props.autoAdvance && target.type === 'radio' && index < last) window.setTimeout(next, 180);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    for (let i = 0; i <= last; i++) {
      if (!validate(i)) {
        event.preventDefault();
        goTo(i);
        return;
      }
    }
  }

  if (result?.ok) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className={styles.success}>
        {success}
      </div>
    );
  }

  return (
    <ErrorsContext.Provider value={{ ...clientErrors, ...serverErrors }}>
      <fetcher.Form
        ref={formRef}
        method="post"
        action={action}
        noValidate={hydrated}
        className={hydrated ? `${styles.form} ${styles.enhanced}` : styles.form}
        onKeyDown={onKeyDown}
        onChange={onChange}
        onSubmit={onSubmit}
      >
        <div className={styles.meta}>
          <p aria-live="polite">
            Step {index + 1} of {steps.length}
          </p>
          {timeHint && <p>{timeHint}</p>}
        </div>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ '--progress': `${((index + 1) / steps.length) * 100}%` } as CSSProperties} />
        </div>

        <input type="hidden" name="source" value={location.pathname} />
        <div className={styles.honeypot} aria-hidden="true">
          <label>
            Leave this field empty
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {steps.map((step, i) => (
          <fieldset key={i} data-step={i} data-active={i === index ? '' : undefined} className={styles.step}>
            <legend className={styles.legend}>
              <span
                ref={(el) => {
                  titleRefs.current[i] = el;
                }}
                tabIndex={-1}
                className={styles.title}
              >
                {step.props.title}
              </span>
            </legend>
            {step.props.hint && <div className={styles.hint}>{step.props.hint}</div>}
            <div className={styles.body}>{step.props.children}</div>
            {i === last && turnstileSiteKey && hydrated && reachedLast && <Turnstile siteKey={turnstileSiteKey} resetKey={turnstileReset} />}
            <div className={styles.nav}>
              {i > 0 && (
                <button type="button" className={styles.back} onClick={back}>
                  Back
                </button>
              )}
              {i < last ? (
                <button type="button" className={styles.next} onClick={next}>
                  Continue
                </button>
              ) : (
                <button type="submit" className={styles.next} disabled={submitting}>
                  {submitting ? 'Sending…' : submitLabel}
                </button>
              )}
            </div>
          </fieldset>
        ))}

        {serverErrors.form && (
          <p className={styles.formError} role="alert">
            {serverErrors.form}
          </p>
        )}
        {footnote && <div className={styles.footnote}>{footnote}</div>}
      </fetcher.Form>
    </ErrorsContext.Provider>
  );
}

/* ---------------------------------------------------------------- fields */

type FieldProps = {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date';
  multiline?: boolean;
  /** Fields are required unless marked otherwise; optional ones get "(optional)" in the label */
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  hint?: string;
  placeholder?: string;
  /** Message shown when the field is missing or invalid, e.g. "Add an email so we can reply" */
  errorMessage?: string;
  maxLength?: number;
  rows?: number;
};

export function Field({
  label,
  name,
  type = 'text',
  multiline = false,
  required = true,
  autoComplete,
  inputMode,
  hint,
  placeholder,
  errorMessage,
  maxLength = multiline ? 2000 : 200,
  rows = 4,
}: FieldProps) {
  const id = useId();
  const error = useContext(ErrorsContext)[name];
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const shared = {
    id,
    name,
    required,
    placeholder,
    maxLength,
    className: styles.input,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'data-error': errorMessage,
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {!required && <span className={styles.optional}> (optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={styles.fieldHint}>
          {hint}
        </p>
      )}
      {multiline ? <textarea {...shared} rows={rows} /> : <input {...shared} type={type} autoComplete={autoComplete} inputMode={inputMode} />}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

type ChoiceOption = string | { value: string; label: string; description?: string };

type ChoicesProps = {
  name: string;
  options: ChoiceOption[];
  /** Checkboxes instead of radio buttons */
  multiple?: boolean;
  required?: boolean;
  errorMessage?: string;
};

/** Tappable chips backed by real radio/checkbox inputs (keyboard and screen readers work natively). */
export function Choices({ name, options, multiple = false, required = false, errorMessage = 'Choose one of the options' }: ChoicesProps) {
  const id = useId();
  const error = useContext(ErrorsContext)[name];
  return (
    <div className={styles.choices}>
      {options.map((option) => {
        const { value, label, description } = typeof option === 'string' ? { value: option, label: option, description: undefined } : option;
        return (
          <label key={value} className={styles.choice}>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={value}
              required={required && !multiple}
              data-error={errorMessage}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            <span>
              {label}
              {description && <small>{description}</small>}
            </span>
          </label>
        );
      })}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- turnstile */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

/** Loads Cloudflare Turnstile on demand and renders it inside the form (it adds the cf-turnstile-response field). */
function Turnstile({ siteKey, resetKey }: { siteKey: string; resetKey: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = () => {
      if (window.turnstile && !widgetId.current) {
        widgetId.current = window.turnstile.render(el, { sitekey: siteKey, action: 'lead', appearance: 'interaction-only' });
      }
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.dataset.turnstile = '';
        document.head.appendChild(script);
      }
      script.addEventListener('load', render, { once: true });
    }
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  return <div ref={ref} className={styles.turnstile} />;
}
