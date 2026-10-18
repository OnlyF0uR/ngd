import {
  Children,
  createContext,
  Fragment,
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

export type StepFormLabels = {
  /** "Step {current} of {total}" */
  step: string;
  continue: string;
  back: string;
  sending: string;
  optional: string;
  /** Shown when someone submits before the bot check has produced a token */
  verifying: string;
};

const DEFAULT_LABELS: StepFormLabels = {
  step: 'Step {current} of {total}',
  continue: 'Continue',
  back: 'Back',
  sending: 'Sending…',
  optional: '(optional)',
  verifying: 'One moment, we’re checking that you’re not a robot. Then press send again.',
};

const FormContext = createContext<{ errors: Record<string, string>; labels: StepFormLabels }>({ errors: {}, labels: DEFAULT_LABELS });

type StepProps = {
  title: string;
  hint?: ReactNode;
  /** Single-choice steps: advance automatically after a choice made by pointer (mouse/touch). Keyboard users press Continue. */
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
  /** Public Turnstile site key; the server verifies the token. Empty or undefined disables the widget. */
  turnstileSiteKey?: string;
  /** Interface text (translate for non-English sites) */
  labels?: Partial<StepFormLabels>;
  children: ReactNode;
};

// Structural type: the Workers runtime types redeclare the global `Element`, which breaks DOM generics like HTMLSelectElement.
type Control = HTMLElement & { name: string; type?: string; validationMessage: string; checkValidity(): boolean };

/** Steps may be wrapped in fragments or produced by .map(); flatten them. */
function collectSteps(children: ReactNode): ReactElement<StepProps>[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    if (child.type === Fragment) return collectSteps((child.props as { children?: ReactNode }).children);
    return child.type === Step ? [child as ReactElement<StepProps>] : [];
  });
}

export function StepForm({ action = '/contact', submitLabel = 'Send', success, footnote, timeHint, turnstileSiteKey, labels: labelOverrides, children }: StepFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const fetcher = useFetcher<LeadActionData>();
  const location = useLocation();
  // Without JavaScript the browser posts to the action route and that page renders the result
  const pageActionData = useActionData() as LeadActionData | undefined;
  const actionData = location.pathname === action ? pageActionData : undefined;
  const steps = collectSteps(children);
  const last = steps.length - 1;

  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [reachedLast, setReachedLast] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRefs = useRef<(HTMLElement | null)[]>([]);
  const successRef = useRef<HTMLDivElement>(null);
  const pointerChoice = useRef(false);

  const result = fetcher.data ?? actionData;
  const serverErrors = Object.fromEntries(Object.entries(result?.errors ?? {}).filter(([name]) => !dismissed.has(name)));
  const errors = { ...clientErrors, ...serverErrors };
  const submitting = fetcher.state !== 'idle';

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (index === last) setReachedLast(true);
  }, [index, last]);

  // After a server response: focus the success message, or jump to the step with the first failing field.
  useEffect(() => {
    if (!result) return;
    setDismissed(new Set());
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

  function validate(i: number) {
    const fieldset = stepElements()[i];
    if (!fieldset) return true;
    const controls = [...fieldset.querySelectorAll<HTMLElement>('input:not([type=hidden]), textarea, select')] as Control[];
    const found: Record<string, string> = {};
    for (const control of controls) {
      if (!control.checkValidity() && !found[control.name]) found[control.name] = control.dataset.error || control.validationMessage;
    }
    // Checkbox groups marked required need at least one checked box (native validation can't express that)
    for (const group of fieldset.querySelectorAll<HTMLElement>('[data-required-group]')) {
      const name = group.dataset.requiredGroup!;
      if (!group.querySelector('input:checked')) found[name] = group.dataset.error || 'Choose at least one option';
    }
    setClientErrors((prev) => {
      const next = { ...prev };
      for (const control of controls) delete next[control.name];
      return { ...next, ...found };
    });
    const first = Object.keys(found)[0];
    if (first) fieldset.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)?.focus();
    return !first;
  }

  function goTo(i: number) {
    setIndex(i);
    setNotice(null);
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
      setDismissed((prev) => (prev.has(target.name) ? prev : new Set(prev).add(target.name)));
    }
    // Arrow keys also change radio selections, so only a pointer choice may advance (WCAG 3.2.2)
    const byPointer = pointerChoice.current;
    pointerChoice.current = false;
    if (byPointer && steps[index]?.props.autoAdvance && target.type === 'radio' && index < last) window.setTimeout(next, 180);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    for (let i = 0; i <= last; i++) {
      if (!validate(i)) {
        event.preventDefault();
        goTo(i);
        return;
      }
    }
    const token = formRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value;
    if (turnstileSiteKey && hydrated && !token) {
      event.preventDefault();
      setNotice(labels.verifying);
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
    <FormContext.Provider value={{ errors, labels }}>
      <fetcher.Form
        ref={formRef}
        method="post"
        action={action}
        noValidate={hydrated}
        className={hydrated ? `${styles.form} ${styles.enhanced}` : styles.form}
        onKeyDown={onKeyDown}
        onPointerDown={() => {
          pointerChoice.current = true;
        }}
        onChange={onChange}
        onSubmit={onSubmit}
      >
        <div className={styles.meta}>
          <p aria-live="polite">{labels.step.replace('{current}', String(index + 1)).replace('{total}', String(steps.length))}</p>
          {timeHint && <p>{timeHint}</p>}
        </div>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ '--progress': `${((index + 1) / steps.length) * 100}%` } as CSSProperties} />
        </div>

        <input type="hidden" name="source" value={location.pathname} />
        {/* Campaign attribution. Rendered after hydration: prerendered HTML never contains the query string */}
        {hydrated &&
          [...new URLSearchParams(location.search)]
            .filter(([key]) => key.startsWith('utm_'))
            .map(([key, value]) => <input key={key} type="hidden" name={key} value={value.slice(0, 200)} />)}
        {/* Honeypot: humans never see or fill it. A neutral name so browsers don't autofill it. */}
        <div className={styles.honeypot} aria-hidden="true">
          <label>
            Leave this field empty
            <input type="text" name="ngd_hp" tabIndex={-1} autoComplete="off" />
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
                  {labels.back}
                </button>
              )}
              {i < last ? (
                <button type="button" className={styles.next} onClick={next}>
                  {labels.continue}
                </button>
              ) : (
                <button type="submit" className={styles.next} disabled={submitting}>
                  {submitting ? labels.sending : submitLabel}
                </button>
              )}
            </div>
          </fieldset>
        ))}

        {(notice || serverErrors.form) && (
          <p className={styles.formError} role="alert">
            {notice ?? serverErrors.form}
          </p>
        )}
        {footnote && <div className={styles.footnote}>{footnote}</div>}
      </fetcher.Form>
    </FormContext.Provider>
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
  /** Help or an example ("For example: …"); placeholders are not labels or hints */
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
  const { errors, labels } = useContext(FormContext);
  const error = errors[name];
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
        {!required && <span className={styles.optional}> {labels.optional}</span>}
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
  /** Radios: one must be chosen. Checkboxes: at least one must be checked. */
  required?: boolean;
  errorMessage?: string;
};

/** Tappable chips backed by real radio/checkbox inputs (keyboard and screen readers work natively). */
export function Choices({ name, options, multiple = false, required = false, errorMessage }: ChoicesProps) {
  const id = useId();
  const error = useContext(FormContext).errors[name];
  const message = errorMessage ?? (multiple ? 'Choose at least one option' : 'Choose one of the options');
  return (
    <div
      className={styles.choices}
      data-required-group={multiple && required ? name : undefined}
      data-error={multiple && required ? message : undefined}
    >
      {options.map((option) => {
        const { value, label, description } = typeof option === 'string' ? { value: option, label: option, description: undefined } : option;
        return (
          <label key={value} className={styles.choice}>
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={value}
              required={required && !multiple}
              data-error={message}
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
