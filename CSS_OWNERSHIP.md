# CSS ownership

SC220 public pages use explicit stylesheet ownership to avoid cascade drift.

## Homepage (`/` and `/en/`)

- **Owner:** `landing-v3.css`
- Scope: every visual rule under `body.landing-page`, including typography, spacing, header, hero, feature tour, trust, install, licence, download, FAQ, user questions, resources, footer, responsive rules, and motion.
- `app.js` owns behavior and release data only. It must not inject CSS or require a visual effect for content to remain visible.
- `landing-fonts.css` and `landing-components.css` are deprecated compatibility stubs and contain no visual rules. Remove their HTML references in the next markup-only cleanup; they must never receive new CSS.

## Shared / documentation pages

- `styles.css`: legacy/shared styles used by documentation and secondary public pages. Do not add homepage-specific fixes here.
- `seo.css`: SEO/article/download-page layout only.
- `site-refinement.css`: guide/support refinement only.
- `sc220-mkii.css` + `sc220-mkii-p1.css`: SC220 MKII guide family only.

## Rules for future changes

1. A selector has one owner. Never fix homepage spacing by adding a later override file.
2. Homepage spacing comes from `--lp-section`, `--lp-section-tight`, and the responsive token overrides in `landing-v3.css`.
3. Scroll-time effects must use compositor-friendly `transform`/`opacity`; avoid `backdrop-filter`, `filter`, permanent `will-change`, and scroll-linked JS styling.
4. Content must remain readable when JavaScript or motion is unavailable.
5. `prefers-reduced-motion` is mandatory for any new animation.
