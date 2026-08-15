# CSS ownership

SC220 public pages use explicit stylesheet ownership to avoid cascade drift.

## Homepage (`/` and `/en/`)

- **Visual owner:** `landing-v3.css`
- Scope: every visual rule under `body.landing-page`, including typography, spacing, header, hero, feature tour, trust, install, licence, download, FAQ, user questions, resources, footer, responsive rules, and motion.
- `app.js` owns behavior and release data only. It must not inject CSS or require a visual effect for content to remain visible.
- `landing-fonts.css` is a deprecated empty compatibility stub and must never receive new CSS.
- `landing-components.css` is temporarily a **legacy-isolation guard only**. It may only neutralize legacy properties from `styles.css` (for example backdrop-filter or old perspective transform) until the old homepage `<link>` references are removed. It does not own spacing, typography, layout, color, or component styling.

## Shared / documentation pages

- `styles.css`: legacy/shared styles used by documentation and secondary public pages. Do not add homepage-specific fixes here.
- `seo.css`: SEO/article/download-page layout only.
- `site-refinement.css`: guide/support refinement only.
- `sc220-mkii.css` + `sc220-mkii-p1.css`: SC220 MKII guide family only.

## Rules for future changes

1. A selector has one visual owner. Never fix homepage spacing by adding a later override file.
2. Homepage spacing comes from `--lp-section`, `--lp-section-tight`, and responsive token overrides in `landing-v3.css`.
3. Scroll-time effects must use compositor-friendly `transform`/`opacity`; avoid `backdrop-filter`, `filter`, permanent `will-change`, and scroll-linked JS styling.
4. Content must remain readable when JavaScript or motion is unavailable.
5. `prefers-reduced-motion` is mandatory for any new animation.
6. The isolation guard must shrink over time and disappear once homepage markup stops loading `styles.css`.
