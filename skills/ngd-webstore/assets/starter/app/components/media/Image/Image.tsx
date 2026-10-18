import type { CSSProperties } from 'react';
import styles from './Image.module.css';

/** Output of a vite-imagetools import with `&as=picture`, e.g. `import hero from './hero.jpg?w=640;1280;1920&format=avif;webp&as=picture'` */
export type PictureSource = {
  sources: Record<string, string | { src: string; w: number }[]>;
  img: { src: string; w: number; h: number };
};

type BaseProps = {
  /** Describe what the image shows in context; "" for purely decorative images */
  alt: string;
  /** The LCP image (usually the hero): loads eagerly with high fetch priority. Use on one image per page. */
  priority?: boolean;
  /** Real rendered width, e.g. "(min-width: 960px) 50vw, 100vw". Wrong values waste bandwidth. */
  sizes?: string;
  /** Background shown while loading (dominant color of the image) */
  placeholder?: string;
  className?: string;
};

type ImageProps =
  | (BaseProps & { picture: PictureSource; src?: never; srcSet?: never; width?: number; height?: number })
  | (BaseProps & { picture?: never; src: string; srcSet?: string; width: number; height: number });

const toSrcSet = (value: string | { src: string; w: number }[]) =>
  typeof value === 'string' ? value : value.map((s) => `${s.src} ${s.w}w`).join(', ');

const MIME: Record<string, string> = { avif: 'image/avif', webp: 'image/webp', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' };

/**
 * The image contract: explicit dimensions (no layout shift), responsive sources, lazy by default,
 * eager + fetchpriority=high only for the LCP image, and a placeholder color while loading.
 */
export function Image(props: ImageProps) {
  const { alt, priority = false, sizes = '100vw', placeholder, className } = props;
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
  const style = placeholder ? ({ '--placeholder': placeholder } as CSSProperties) : undefined;
  const classes = [styles.image, className].filter(Boolean).join(' ');

  if (props.picture) {
    const { sources, img } = props.picture;
    return (
      <picture>
        {Object.entries(sources).map(([format, srcSet]) => (
          <source key={format} type={MIME[format] ?? `image/${format}`} srcSet={toSrcSet(srcSet)} sizes={sizes} />
        ))}
        <img
          src={img.src}
          width={props.width ?? img.w}
          height={props.height ?? img.h}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          className={classes}
          style={style}
        />
      </picture>
    );
  }

  return (
    <img
      src={props.src}
      srcSet={props.srcSet}
      sizes={props.srcSet ? sizes : undefined}
      width={props.width}
      height={props.height}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      className={classes}
      style={style}
    />
  );
}
