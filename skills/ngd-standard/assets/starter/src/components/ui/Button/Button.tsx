import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createLink, type LinkComponent } from '@tanstack/react-router';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

type StyleProps = {
  variant?: Variant;
  size?: Size;
  /** Adds a trailing arrow that nudges on hover */
  arrow?: boolean;
  className?: string;
  children?: ReactNode;
};

function classes({ variant = 'primary', size = 'md', className }: StyleProps) {
  return [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
}

function Content({ arrow, children }: StyleProps) {
  return (
    <>
      <span>{children}</span>
      {arrow && (
        <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </>
  );
}

/** The one button, as a <button>. For navigation use ButtonLink. */
export function Button({
  variant,
  size,
  arrow,
  className,
  children,
  type = 'button',
  ...rest
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type={type} className={classes({ variant, size, className })}>
      <Content arrow={arrow}>{children}</Content>
    </button>
  );
}

const ButtonAnchor = forwardRef<HTMLAnchorElement, StyleProps & AnchorHTMLAttributes<HTMLAnchorElement>>(function ButtonAnchor(
  { variant, size, arrow, className, children, ...rest },
  ref,
) {
  return (
    <a ref={ref} {...rest} className={classes({ variant, size, className })}>
      <Content arrow={arrow}>{children}</Content>
    </a>
  );
});

const RouterButtonAnchor = createLink(ButtonAnchor);

/** The same button as a router link. `to` (and `params`, `search`, `hash`) are type-checked against the routes. */
export const ButtonLink: LinkComponent<typeof ButtonAnchor> = (props) => <RouterButtonAnchor preload="intent" {...props} />;
