import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import styles from './EmptyState.module.css';

/** Says why the space is empty and offers the next step. Title level fits under the page's h1. */
export function EmptyState({ icon = 'inbox', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {text && <p className={styles.text}>{text}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
