import type { CSSProperties, ReactNode } from 'react';
import { panel } from '~/lib/panel';
import styles from './Skeleton.module.css';

/** A placeholder block. Size it like the content it stands in for, so nothing jumps when data arrives. */
export function Skeleton({ width = '100%', height = '1em', radius, className }: { width?: string; height?: string; radius?: string; className?: string }) {
  const style = { '--skeleton-w': width, '--skeleton-h': height, ...(radius ? { '--skeleton-r': radius } : {}) } as CSSProperties;
  return <span className={className ? `${styles.skeleton} ${className}` : styles.skeleton} style={style} aria-hidden="true" />;
}

/** Wraps a group of skeletons: screen readers hear "Loading" once instead of a row of empty shapes. */
export function Loading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} aria-busy="true">
      <span className="visually-hidden">{panel.ui.loading}</span>
      {children}
    </div>
  );
}
