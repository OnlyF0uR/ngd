import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Adds a trailing arrow that nudges on hover */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps & Omit<LinkProps, 'className' | 'children'> & { to: LinkProps['to'] };
type ButtonAsButton = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { to?: undefined };

/** The one button. A `to` prop renders a router Link, otherwise a <button>. */
export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = 'primary', size = 'md', arrow = false, className, children } = props;
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </>
  );

  if (props.to !== undefined) {
    const { variant: _v, size: _s, arrow: _a, className: _c, children: _ch, ...linkProps } = props;
    return (
      <Link {...linkProps} className={classes}>
        {content}
      </Link>
    );
  }
  const { variant: _v, size: _s, arrow: _a, className: _c, children: _ch, to: _t, type = 'button', ...buttonProps } = props;
  return (
    <button {...buttonProps} type={type} className={classes}>
      {content}
    </button>
  );
}
