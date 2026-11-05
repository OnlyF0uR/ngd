import type { ReactNode } from 'react';
import styles from './StatusPill.module.css';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Status = color + dot + word, never color alone. Status colors are for status only. */
export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={styles.pill} data-tone={tone}>
      {children}
    </span>
  );
}
