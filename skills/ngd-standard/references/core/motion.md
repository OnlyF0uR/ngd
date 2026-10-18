# Motion

Motion makes an interface feel alive and explains change: something appeared, moved, was saved. Done wrong it makes sites slow, hides content from search engines and makes some people physically ill. The user chooses the level (discovery); this file tells you how to deliver it safely.

## Contents
1. Levels and what they mean
2. Rules that are never broken
3. Tokens
4. Recipes (CSS-first, with code)
5. When JavaScript animation is justified
6. Checklist

## 1. Levels and what they mean

| | None | Subtle (default) | Expressive / storytelling |
|---|---|---|---|
| Entrance (page load) | nothing | hero text and visual settle in with a short transform, ≤ 600ms total | choreographed hero sequence, staggered, still transform-led for the main heading |
| Scroll | nothing | sections fade/rise in once as they enter | sticky storytelling sections, scroll-linked progress, image clip reveals, gentle parallax |
| Micro-interactions | instant state changes, focus rings | hover, press, arrow nudges, accordion, toasts | richer hover states, shared-element transitions between pages |
| Route changes | none | quick cross-fade via View Transitions | shared-element morphs (card image → detail image) |

"None" still keeps functional feedback (focus rings, pressed states, loading indicators): those are usability, not decoration.

## 2. Rules that are never broken

1. **Content is visible at first paint without JavaScript.** Server-rendered HTML must show every word. Never ship `opacity: 0` in CSS that waits for a script to undo it, and never hide the hero until hydration. Search engines, slow phones and people with JavaScript disabled must all see the page.
2. **Don't delay the Largest Contentful Paint.** The hero heading and hero image are usually the LCP element. Animate them with `transform` only (a small rise or scale); don't fade them from transparent and don't wait to start.
3. **No loading screens, splash screens or preloaders.** Ever. The fastest page is the one that shows up.
4. **Never hijack scrolling.** No smooth-scroll libraries, no scroll snapping on the whole page, no "one section per wheel tick", no scroll speed changes. Native scrolling is fast, accessible and what people expect.
5. **Respect `prefers-reduced-motion`.** Put decorative motion inside `@media (prefers-reduced-motion: no-preference)`. In reduced mode keep only instant or opacity-only state changes.
6. **Animate cheap properties:** `transform`, `opacity`, `filter`, `clip-path`. Avoid animating `width`, `height`, `top`, `margin` or `box-shadow` on large elements.
7. **Reveal once.** Content that has appeared stays put when scrolling back up (CSS scroll-linked effects are fine for decorative, position-tied motion).
8. **Short and snappy.** UI feedback 120–200ms, larger moves 250–400ms, reveals up to about 600ms. Stagger 40–80ms between siblings, at most about 5 steps.
9. **No layout shift.** Anything that animates in reserves its space from the start.

## 3. Tokens

Put these in global.css (they are part of the small base layer):

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);     /* entrances, reveals, things arriving */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* things changing state or moving across */
  --dur-fast: 120ms;    /* hover, press, color */
  --dur-base: 200ms;    /* toggles, menus, tooltips */
  --dur-slow: 320ms;    /* sheets, dialogs, larger moves */
  --dur-reveal: 600ms;  /* scroll and entrance reveals */
}
```

## 4. Recipes

All recipes assume CSS Modules; class names are local to the component's `.module.css`.

### 4.1 Micro-interactions (every level except "none")

```css
.button {
  transition: background-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.button:active { transform: scale(0.98); }
.button .arrow { transition: transform var(--dur-base) var(--ease-out); }
.button:hover .arrow { transform: translateX(3px); }

.card { transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); }
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
}
```

### 4.2 Hero entrance (subtle), safe for LCP

Everything in the first viewport moves but never starts invisible: the heading, the call to action and the main visual are readable and clickable from the first frame.

```css
@media (prefers-reduced-motion: no-preference) {
  .title   { animation: rise var(--dur-reveal) var(--ease-out) both; }
  .lead    { animation: rise var(--dur-reveal) var(--ease-out) 60ms both; }
  .actions { animation: rise var(--dur-reveal) var(--ease-out) 120ms both; }
  .visual  { animation: settle 900ms var(--ease-out) both; }
}
@keyframes rise   { from { transform: translateY(14px); } }
@keyframes settle { from { transform: scale(1.03); } }
```

Fades from transparent belong to decorative extras (a badge, a floating card, background shapes), never to the heading, the call to action or the LCP image.

These run from CSS as soon as the stylesheet arrives: no JavaScript, no waiting for hydration.

### 4.3 Scroll reveal, CSS-only (subtle)

Scroll-driven animations need no JavaScript. Browsers without support simply show the content.

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 5% entry 40%;
    }
  }
}
@keyframes reveal { from { opacity: 0; transform: translateY(24px); } }
```

Content already in the viewport at load is past its entry range, so it is fully visible immediately. This effect follows the scroll position (it reverses if you scroll back), which is fine for subtle reveals.

### 4.4 Reveal once with stagger (expressive), progressive

Use when you want the "appears once, in sequence" feel or need support beyond scroll-driven animations. Elements are only hidden after hydration, and only if they are still below the fold, so nothing visible ever blinks away.

```tsx
// app/components/motion/Reveal/Reveal.tsx (in the starter)
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './Reveal.module.css';

type RevealProps = { children: ReactNode; delay?: number; className?: string };

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it alone
    el.dataset.reveal = 'pending';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
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
```

```css
/* Reveal.module.css */
.reveal[data-reveal='pending'] { opacity: 0; transform: translateY(24px); }
.reveal[data-reveal='in'] {
  opacity: 1;
  transform: none;
  transition: opacity var(--dur-reveal) var(--ease-out) var(--reveal-delay, 0ms),
              transform var(--dur-reveal) var(--ease-out) var(--reveal-delay, 0ms);
}
```

For many items on one page, share a single IntersectionObserver through a small hook instead of one per element.

### 4.5 Sticky storytelling (storytelling level)

`position: sticky` gives the pinned-column effect without any scroll listeners:

```css
.story { display: grid; gap: 48px; }
@media (min-width: 960px) {
  .story { grid-template-columns: 5fr 7fr; }
  .pinned { position: sticky; top: calc(var(--header-h) + 32px); align-self: start; }
}
```

Scroll-linked extras (a progress line, a slowly scaling image) use `animation-timeline: view()` or `scroll()` inside `@supports`, like 4.3.

### 4.6 Route transitions with the View Transitions API

React Router can wrap navigations in a view transition: add `viewTransition` to `<Link>`, `<NavLink>` or `<Form>`. The default is a cross-fade of the whole page; keep it quick:

```css
/* global.css */
::view-transition-old(root),
::view-transition-new(root) { animation-duration: 180ms; }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
}
```

Shared-element morphs (a product card image growing into the product page image): give both elements the same `view-transition-name` only while that transition runs. React Router's `useViewTransitionState(href)` tells a link whether its transition is in progress, so you can set the name conditionally. Names must be unique on the page.

### 4.7 Logo marquee

```css
.marquee { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.track { display: flex; gap: 56px; width: max-content; animation: marquee 40s linear infinite; }
.marquee:hover .track { animation-play-state: paused; }
@keyframes marquee { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .track { animation: none; width: auto; flex-wrap: wrap; justify-content: center; }
}
```

Render the logo list twice; mark the second copy `aria-hidden="true"` (and hide it in reduced motion).

### 4.8 Accordions, dialogs, popovers and toasts

```css
/* <details> that animates where supported, and simply opens elsewhere */
.faq { interpolate-size: allow-keywords; }
.faq::details-content {
  block-size: 0;
  overflow: clip;
  transition: block-size var(--dur-slow) var(--ease-out), content-visibility var(--dur-slow) allow-discrete;
}
.faq[open]::details-content { block-size: auto; }

/* entry/exit for <dialog> and [popover] without JavaScript animation code */
.sheet {
  transition: opacity var(--dur-base), transform var(--dur-slow) var(--ease-out), display var(--dur-slow) allow-discrete, overlay var(--dur-slow) allow-discrete;
  opacity: 0;
  transform: translateY(16px);
}
.sheet[open], .sheet:popover-open { opacity: 1; transform: none; }
@starting-style { .sheet[open], .sheet:popover-open { opacity: 0; transform: translateY(16px); } }
```

### 4.9 Skeleton shimmer (panels, lazy data)

```css
.skeleton { position: relative; overflow: hidden; border-radius: 6px; background: color-mix(in oklab, var(--color-text) 8%, transparent); }
.skeleton::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-bg) 55%, transparent), transparent);
  animation: shimmer 1.6s infinite;
}
@keyframes shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .skeleton::after { animation: none; } }
```

### 4.10 Numbers

Avoid count-up animations for meaningful figures. If you use one, the server-rendered HTML must contain the final number, and the animation must be purely visual (the accessible text stays the final value).

## 5. When JavaScript animation is justified

CSS covers nearly everything on marketing pages. Reach for a library only for physics, drag gestures or complex orchestration in a specific interactive section, and then:
- prefer a small library (the `motion` package's vanilla `animate()` is small) over a large framework;
- load it only on the route or component that needs it (`React.lazy` / dynamic `import()`), never in the root bundle;
- keep the reduced-motion and visible-content rules.

## 6. Checklist

- [ ] Hero heading and image visible at first paint (check with JavaScript disabled).
- [ ] No element in the first viewport starts at `opacity: 0`.
- [ ] Every decorative animation is inside `prefers-reduced-motion: no-preference`.
- [ ] No preloader, no scroll-jacking, no smooth-scroll library.
- [ ] Only transform/opacity/filter/clip-path animate on large elements.
- [ ] Durations within the token ranges; stagger short.
- [ ] Reduced motion tested (DevTools → Rendering → emulate prefers-reduced-motion).
