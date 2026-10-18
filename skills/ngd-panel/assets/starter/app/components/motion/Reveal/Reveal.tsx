import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './Reveal.module.css';

type RevealProps = { children: ReactNode; delay?: number; className?: string };

/**
 * Reveal-once on scroll. Server HTML is always visible; only elements still below the fold after
 * hydration are hidden and then revealed, so nothing on screen ever blinks away. Respects reduced motion.
 * For the CSS-only variant (no JavaScript at all) see references/core/motion.md 4.3.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.reveal = 'pending';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset.reveal = 'in';
        io.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `${styles.reveal} ${className}` : styles.reveal}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
