# BOOMYUNG homepage — siteG (motion renewal)

Static multi-page site on Cloudflare Pages + Functions + D1 (`boomyung-siteg-db`),
forked from siteF and rebuilt with a motion layer.

## Motion layer

- `css/motion.css`, `js/motion.js` — loaded on every public page (not admin).
- `js/vendor/` — GSAP 3.13 + ScrollTrigger, Lenis 1.3 (Lenis is wrapped in an IIFE so
  its minified top-level helpers don't overwrite the site's global `t()`).
- Pages render asynchronously and re-render on language toggle, so `motion.js` wraps the
  global `observeReveals()` that every page calls after rendering and re-binds there.
- Everything is skipped under `prefers-reduced-motion`; cursor, tilt, magnetic buttons,
  smooth scroll and the pinned showcase run only on desktop pointers.

Includes: first-visit intro loader, page-transition curtain, scroll progress bar,
auto-hiding header, custom cursor, magnetic buttons, word-mask headline reveals,
card reveals and 3D tilt, image mask reveals, parallax, velocity-driven kinetic type
bands, a mouse-reactive network particle field and looping video in the home hero,
a pinned "we make it ourselves" showcase whose video window opens to full screen,
and a footer wordmark.
