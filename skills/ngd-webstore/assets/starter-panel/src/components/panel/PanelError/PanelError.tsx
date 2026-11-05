import { isNotFound, Link, useRouter } from '@tanstack/react-router';
import { FORBIDDEN } from '~/lib/permissions';
import { panel } from '~/lib/panel';
import { Icon } from '../Icon';
import styles from './PanelError.module.css';

/** A screen-level error inside the shell: what happened and what to do, never a stack trace in production. */
export function PanelError({ error }: { error: unknown }) {
  const status =
    isNotFound(error) || (error as { status?: number } | null)?.status === 404
      ? 404
      : error instanceof Error && error.message === FORBIDDEN
        ? 403
        : 500;
  const [title, text] =
    status === 404
      ? [panel.ui.notFoundTitle, panel.ui.notFoundText]
      : status === 403
        ? [panel.ui.forbiddenTitle, panel.ui.forbiddenText]
        : [panel.ui.errorTitle, panel.ui.errorText];
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <div className={styles.error} role="alert">
      <Icon name="alert" className={styles.icon} />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{text}</p>
      <Link to={panel.home} className={styles.link}>
        {panel.ui.backToOverview}
      </Link>
      {stack && <pre className={styles.stack}>{stack}</pre>}
    </div>
  );
}

/** For a widget's error boundary: one failing widget says so and offers a retry; the rest of the screen keeps working. */
export function WidgetError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const retry = () => {
    reset();
    void router.invalidate(); // reloads the current routes' data
  };
  return (
    <div className={styles.widget} role="alert">
      <Icon name="alert" />
      <span>{panel.ui.widgetError}</span>
      <button type="button" className={styles.retry} onClick={retry}>
        {panel.ui.retry}
      </button>
    </div>
  );
}
