# Imagery: sourcing, generating, optimising

Images sell. They are also the heaviest thing on most pages and the easiest way to look generic or untrustworthy. This file covers where images come from, how to generate them responsibly, and how to ship them fast.

## Contents
1. Decide the source with the user
2. Art direction
3. Generating images with an AI tool
4. Stock photos
5. User-provided images
6. Optimising and serving
7. The image component contract
8. Icons, logos and illustrations
9. Video
10. Alt text

## 1. Decide the source with the user

The discovery interview asks whether the site uses images and where they come from (discovery.md → Images). Record the answer in DESIGN.md. Typical outcomes:
- **Provided** (product photos, team, premises): the most trustworthy option. Ask for originals at the highest resolution available.
- **Generated** with a connected image tool: good for atmospheric scenes, abstract backgrounds, 3D objects, illustrations and concept visuals.
- **Stock** from free-licence libraries: fine for lifestyle and atmosphere, never for "our team" or "our customers".
- **None**: the design leans on typography, color fields, shapes, icons and interface fragments. This can look outstanding; plan it from the presets on.
- **Placeholders for now**: build with labelled placeholders of the correct aspect ratio and list every slot in `design/image-slots.md` (page, slot, aspect ratio, what it should show) so the user can supply images later.

## 2. Art direction

Write a short art direction block into DESIGN.md before sourcing anything, so every image looks like it belongs to the same brand:
- **Subject and story:** what each image proves (calm treatment room → "this place is peaceful").
- **Light:** natural daylight / warm golden hour / soft studio / moody low-key.
- **Color grade:** neutral, warm or cool; how it relates to the theme color (echo it in props or backgrounds rather than tinting everything).
- **Framing:** close-up details vs wide spaces; negative space where text will sit; consistent lens feel (35mm documentary, 85mm portrait).
- **People:** diverse, natural, mid-action, not posing at the camera, matching the real audience.
- **Format per slot:** hero 16:9 or 4:5 (mobile crop), cards 4:3 or 1:1, portraits 4:5, OG image 1200×630.

## 3. Generating images with an AI tool

Only when an image-generation tool is connected (check your tool list: anything that generates or edits images). Workflow:
1. **List the slots** (page, slot, aspect ratio, subject) and show the list with the art direction to the user.
2. **Check cost.** Many tools charge credits; some require an estimate call and the user's approval before generating. Get approval for the batch, and say how many images you'll create.
3. **Write consistent prompts.** One shared style suffix for the whole site (light, grade, lens, mood, "no text, no logos, no watermark"), plus a per-slot subject line. Ask for the slot's aspect ratio directly instead of cropping later.
4. **Review every result** at full size: hands, faces, text artefacts, impossible objects, uncanny details, accidental logos. Regenerate what fails. Generate 2–3 candidates for the hero and pick the best.
5. **Save originals** to `design/assets-src/` (not deployed), then optimise them into the app (section 6). Log the prompt and tool per image in `design/image-credits.md`.

Never generate:
- people presented as real customers, patients, reviewers or staff (fake testimonials and fake team photos are deceptive and in many places unlawful);
- product photos that misrepresent what a customer will receive (a webstore needs real product photography; AI can do backgrounds and lifestyle scenes around a real product shot only if the product itself is unaltered);
- before/after or result images for health, beauty or fitness claims;
- anything resembling a real person, brand, logo or copyrighted character.

## 4. Stock photos

- Use free-licence libraries (for example Unsplash or Pexels; check the current licence). Prefer less-used photographers and avoid the first page of results; everyone else picked those.
- Choose images that match the art direction and look like the real audience. Skip clichés (handshakes, headsets, people pointing at screens, lightbulbs).
- Download the original, then optimise. Record source URL and photographer in `design/image-credits.md`; add attribution on the site where the licence asks for it.

## 5. User-provided images

- Copy them into `design/assets-src/` untouched; never edit the originals.
- Check resolution: the hero needs at least 2400px on the long side for sharp large screens. If an image is too small, use it in a smaller slot rather than upscaling it badly.
- Check rights for third-party images (press photos, photographer portfolios).
- Fix only what's needed: crop to the slot's aspect ratio, straighten, mild exposure balance. Don't change products.

## 6. Optimising and serving

Targets: hero image under ~200 KB at mobile width, most content images under ~100 KB, no image wider than it is displayed (×2 for high-density screens).

- **Formats:** AVIF first, WebP fallback via `<picture>`, or just WebP when simplicity matters (support is universal). JPEG/PNG only as last fallback; SVG for logos and icons.
- **Responsive sizes:** generate widths such as 480, 768, 1080, 1440, 1920 (2560 only for full-bleed heroes) and serve them with `srcset` + an accurate `sizes`.
- **Where to generate variants:** at build time with `vite-imagetools` (the starter's default): import the image with a query (`?w=640;1280;1920&format=avif;webp&as=picture`) and Vite writes hashed files under `/assets/`, which the long-cache rule covers. Cloudflare Images or Image Transformations can resize on the fly at the edge; use them when the catalogue is large or managed by non-developers (see architecture.md for the binding). Image processing (`sharp`) never runs inside a Worker.
- **Dimensions:** always set `width` and `height` (or `aspect-ratio`) so nothing shifts while loading.
- **Priority:** the LCP image gets `fetchpriority="high"`, no lazy loading, and a `<link rel="preload" as="image" imagesrcset=… imagesizes=…>` from the route's `links` export when it isn't discoverable early. Everything else gets `loading="lazy" decoding="async"`.
- **Placeholders:** a dominant-color background (or a tiny blurred inline image) on the image's wrapper, so space isn't a white hole while loading.
- **Art direction across breakpoints:** a `<picture>` with a `media` source for a different mobile crop (portrait 4:5 instead of 16:9).
- **Caching:** hashed or versioned filenames served with long `Cache-Control` (`public, max-age=31536000, immutable`).

## 7. The image component contract

Wrap these rules in one shared component (the starter's `app/components/media/Image/Image.tsx`) so no page can forget them. It should:
- require `alt` (empty string allowed for decorative images), `width` and `height`;
- build `srcset` from the available widths and accept a `sizes` prop (with a sensible default);
- accept `priority` to switch to `fetchpriority="high"` and eager loading, otherwise lazy;
- optionally render `<picture>` with AVIF/WebP sources and a mobile art-direction source;
- set a background placeholder color.

## 8. Icons, logos and illustrations

- **Icons:** one consistent set and stroke width (1.5–2px at 24px). Use an icon package that tree-shakes per icon (for example `lucide-react`), or inline SVG components. Never an icon font. Icons inherit `currentColor`.
- **Logos:** SVG, optimised (SVGO). Provide a version for dark backgrounds. Client logo walls in a single monochrome tone.
- **Illustrations and 3D objects:** one style throughout. Export SVG for flat illustration; WebP/AVIF with transparency for 3D renders.
- **Favicon set:** SVG favicon (with a dark-mode media query inside if needed), 180×180 apple-touch-icon, 192/512 PNG for the web manifest, linked from `root.tsx`.
- **Social card (OG image):** 1200×630, legible at thumbnail size, brand-consistent. A default for the site, plus specific ones for key pages (articles, products). A quick way to make them: design the card as a small HTML page using the site's tokens and fonts (`design/og/home.html`), then capture it with `node <skill-dir>/scripts/screenshot.mjs design/og/home.html --widths 1200 --height 630 --screens 1 --out public/og` and rename the saved file (it ends in `-1200.png`) to `default.png`, the starter's `site.defaultOgImage`. Page-specific cards are passed as absolute URLs through `seo({ image })`.
- **Favicons:** export the SVG mark, then PNGs (180×180 apple-touch-icon, 192 and 512 for the manifest); the same screenshot trick works for PNGs from an HTML page with the mark centred.

## 9. Video

Use video only when motion tells the story better than a photo (a space, a process, a product in use):
- muted, `playsinline`, `loop` for ambient clips; real controls for anything with sound or longer than about 20 seconds;
- a poster image (it's what counts as LCP), `preload="none"` or `metadata`;
- small: under about 2–3 MB for an ambient clip, encoded H.264/MP4 plus WebM/AV1; consider Cloudflare Stream for longer content;
- pause it under `prefers-reduced-motion` and when it scrolls out of view;
- provide captions for spoken content.

## 10. Alt text

Describe what the image communicates in context, in the page language, in under about 125 characters. "Physiotherapist guiding a client through a knee exercise" beats "image of physio". Decorative images get `alt=""`. Don't stuff keywords; describe honestly and keywords appear naturally. Product images name the product and the variant shown ("Linen shirt in sage, front view").
