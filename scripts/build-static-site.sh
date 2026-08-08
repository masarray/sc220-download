#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-cloudflare}"
CANONICAL_ORIGIN="https://sc220.pages.dev"
LEGACY_ORIGIN="https://masarray.github.io/sc220-download"

case "$TARGET" in
  cloudflare|github) ;;
  *)
    echo "Unknown target: $TARGET (expected: cloudflare or github)" >&2
    exit 2
    ;;
esac

rm -rf dist
mkdir -p dist

# Keep the public site identical on both origins while excluding repository-only files.
rsync -a \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude 'dist/' \
  --exclude 'scripts/' \
  --exclude '*.md' \
  ./ dist/

# sc220.pages.dev is the single SEO authority. The GitHub Pages copy deliberately
# publishes the same canonical/hreflang/schema URLs so search engines consolidate
# ranking signals instead of treating both hosts as competing duplicate sites.
while IFS= read -r -d '' file; do
  sed -i "s#${LEGACY_ORIGIN}#${CANONICAL_ORIGIN}#g" "$file"
done < <(find dist -type f \( -name '*.html' -o -name '*.xml' -o -name '*.txt' -o -name '*.webmanifest' \) -print0)

# Enrich the deployed HTML without duplicating large static source files. These
# transforms keep both hosting origins identical while the canonical remains Cloudflare.
python3 - <<'PY'
from pathlib import Path


def replace_once(path, old, new, label):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"SEO build transform missing [{label}] in {path}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")

# Homepage: make the large above-the-fold screenshot a high-priority LCP candidate.
replace_once(
    "dist/index.html",
    '<img src="sc220-live-console.png" width="1680" height="945" alt=',
    '<img src="sc220-live-console.png" width="1680" height="945" fetchpriority="high" decoding="async" alt=',
    "id hero fetchpriority",
)
replace_once(
    "dist/en/index.html",
    '<img src="../sc220-live-console.png" width="1680" height="945" alt=',
    '<img src="../sc220-live-console.png" width="1680" height="945" fetchpriority="high" decoding="async" alt=',
    "en hero fetchpriority",
)

# Homepage: static contextual links remain crawlable even before JavaScript injects
# the richer SC220 MKII resource section.
replace_once(
    "dist/index.html",
    '<p>SC220 Live bukan pemutar lagu karaoke dan bukan software kontrol KTV K500. Aplikasi ini menangani tahap capture, mixing audio PC, DSP, metering, dan routing menuju aplikasi siaran.</p>',
    '<p>SC220 Live bukan pemutar lagu karaoke dan bukan software kontrol KTV K500. Aplikasi ini menangani tahap capture, mixing audio PC, DSP, metering, dan routing menuju aplikasi siaran. Untuk hardware, lihat <a href="sc220-mkii-audio-interface/">panduan Recording Tech SC220 MKII</a>.</p>',
    "id contextual hardware link",
)
replace_once(
    "dist/en/index.html",
    '<p>SC220 Live is not a karaoke song player and not KTV K500 control software. It handles capture, PC audio mixing, DSP, metering, and routing into broadcasting applications.</p>',
    '<p>SC220 Live is not a karaoke song player and not KTV K500 control software. It handles capture, PC audio mixing, DSP, metering, and routing into broadcasting applications. For the hardware side, see the <a href="sc220-mkii-audio-interface/">Recording Tech SC220 MKII guide</a>.</p>',
    "en contextual hardware link",
)

# Homepage: provide the fields Google documents for SoftwareApplication rich-result
# eligibility while keeping the visible licensing/download statements consistent.
replace_once(
    "dist/index.html",
    '"inLanguage":"id-ID",\n        "description":',
    '"inLanguage":"id-ID",\n        "softwareVersion":"0.1.0",\n        "datePublished":"2026-08-06",\n        "isAccessibleForFree":true,\n        "offers":{"@type":"Offer","price":"0","priceCurrency":"IDR","availability":"https://schema.org/InStock","url":"https://sc220.pages.dev/download/"},\n        "description":',
    "id software offers",
)
replace_once(
    "dist/en/index.html",
    '"inLanguage":"en-US","description":',
    '"inLanguage":"en-US","softwareVersion":"0.1.0","datePublished":"2026-08-06","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD","availability":"https://schema.org/InStock","url":"https://sc220.pages.dev/en/download/"},"description":',
    "en software offers",
)

# Homepage footer: make key SEO hubs statically discoverable from the strongest page.
replace_once(
    "dist/index.html",
    '<div class="footer-links"><a href="ktv-k500-karaoke-processor/">Panduan KTV K500</a><a href="https://github.com/masarray/sc220-download/releases">Semua rilis</a><a href="https://github.com/masarray/sc220-download">GitHub</a><a href="en/" lang="en">English</a></div>',
    '<div class="footer-links"><a href="download/">Download resmi</a><a href="sc220-mkii-audio-interface/">Panduan SC220 MKII</a><a href="ktv-k500-karaoke-processor/">Panduan KTV K500</a><a href="https://github.com/masarray/sc220-download/releases">Semua rilis</a><a href="https://github.com/masarray/sc220-download">GitHub</a><a href="en/" lang="en">English</a></div>',
    "id footer hubs",
)
replace_once(
    "dist/en/index.html",
    '<div class="footer-links"><a href="ktv-k500-karaoke-processor/">KTV K500 guide</a><a href="https://github.com/masarray/sc220-download/releases">All releases</a><a href="https://github.com/masarray/sc220-download">GitHub</a><a href="../" lang="id">Indonesia</a></div>',
    '<div class="footer-links"><a href="download/">Official download</a><a href="sc220-mkii-audio-interface/">SC220 MKII guide</a><a href="ktv-k500-karaoke-processor/">KTV K500 guide</a><a href="https://github.com/masarray/sc220-download/releases">All releases</a><a href="https://github.com/masarray/sc220-download">GitHub</a><a href="../" lang="id">Indonesia</a></div>',
    "en footer hubs",
)

# Existing substantive support pages now explicitly capture the ambiguous driver
# search intent without creating a thin, duplicate "driver download" doorway page.
replace_once(
    "dist/sc220-mkii-audio-interface/support/index.html",
    '<title>Support SC220 MKII – Checklist Diagnosis & Laporan Masalah</title>',
    '<title>Driver & Support Recording Tech SC220 MKII – Windows 10/11</title>',
    "id support title",
)
replace_once(
    "dist/sc220-mkii-audio-interface/support/index.html",
    '<meta name="description" content="Checklist support Recording Tech SC220 MKII: model, wiring, Windows endpoint, sample rate, input mode, meter, OBS, SC220 Live, langkah diagnosis dan template laporan.">',
    '<meta name="description" content="Panduan driver dan support Recording Tech SC220 MKII untuk Windows 10/11: device tidak muncul, endpoint audio, sample rate, wiring, OBS, diagnosis, dan laporan masalah.">',
    "id support description",
)
replace_once(
    "dist/sc220-mkii-audio-interface/support/index.html",
    '<meta property="og:title" content="Recording Tech SC220 MKII Support">',
    '<meta property="og:title" content="Driver & Support Recording Tech SC220 MKII">',
    "id support og title",
)
replace_once(
    "dist/sc220-mkii-audio-interface/support/index.html",
    '<meta name="twitter:title" content="SC220 MKII Support">',
    '<meta name="twitter:title" content="SC220 MKII Driver & Support">',
    "id support twitter title",
)
replace_once(
    "dist/sc220-mkii-audio-interface/support/index.html",
    '<p class="p1-eyebrow">SC220 MKII SUPPORT</p>\n      <h1>Diagnosis yang rapi dimulai dari data yang lengkap.</h1>\n      <p>Gunakan halaman ini sebelum membuka issue tentang SC220, SC220 MKII, SC220 Live, OBS, TikTok Live Studio, VB-CABLE, atau karaoke processor. Tujuannya adalah memisahkan masalah hardware, Windows, routing, software, dan gain staging.</p>',
    '<p class="p1-eyebrow">SC220 MKII DRIVER & SUPPORT</p>\n      <h1>Driver, Windows, dan diagnosis SC220 MKII.</h1>\n      <p>Gunakan halaman ini saat mencari driver Recording Tech SC220/SC220 MKII, ketika perangkat tidak muncul di Windows, atau sebelum membuka issue tentang SC220 Live, OBS, TikTok Live Studio, VB-CABLE, dan karaoke processor. Tujuannya adalah memisahkan masalah driver, hardware, Windows, routing, software, dan gain staging.</p>',
    "id support hero",
)

replace_once(
    "dist/en/sc220-mkii-audio-interface/support/index.html",
    '<title>SC220 MKII Support – Diagnostic Checklist & Bug Report</title>',
    '<title>Recording Tech SC220 MKII Driver & Support | Windows 10/11</title>',
    "en support title",
)
replace_once(
    "dist/en/sc220-mkii-audio-interface/support/index.html",
    '<meta name="description" content="Recording Tech SC220 MKII support checklist: model, wiring, Windows endpoints, sample rate, input mode, meters, OBS, SC220 Live, diagnostic order, and report template.">',
    '<meta name="description" content="Recording Tech SC220 MKII driver and Windows 10/11 support: device detection, audio endpoints, sample rate, wiring, OBS, diagnostics, and issue reporting.">',
    "en support description",
)
replace_once(
    "dist/en/sc220-mkii-audio-interface/support/index.html",
    '<meta property="og:title" content="Recording Tech SC220 MKII Support">',
    '<meta property="og:title" content="Recording Tech SC220 MKII Driver & Support">',
    "en support og title",
)
replace_once(
    "dist/en/sc220-mkii-audio-interface/support/index.html",
    '<meta name="twitter:title" content="SC220 MKII Support">',
    '<meta name="twitter:title" content="SC220 MKII Driver & Support">',
    "en support twitter title",
)
replace_once(
    "dist/en/sc220-mkii-audio-interface/support/index.html",
    '<p class="p1-eyebrow">SC220 MKII SUPPORT</p>\n      <h1>Good diagnosis starts with complete evidence.</h1>\n      <p>Use this page before opening an issue about SC220, SC220 MKII, SC220 Live, OBS, TikTok Live Studio, VB-CABLE, or a karaoke processor. The goal is to separate hardware, Windows, routing, software, and gain-staging problems.</p>',
    '<p class="p1-eyebrow">SC220 MKII DRIVER & SUPPORT</p>\n      <h1>SC220 MKII drivers, Windows, and diagnosis.</h1>\n      <p>Use this page when searching for a Recording Tech SC220/SC220 MKII driver, when the device does not appear in Windows, or before opening an issue about SC220 Live, OBS, TikTok Live Studio, VB-CABLE, or a karaoke processor. The goal is to separate driver, hardware, Windows, routing, software, and gain-staging problems.</p>',
    "en support hero",
)
PY

# Cloudflare serves the project at the domain root. GitHub Pages still lives under
# /sc220-download/, so its PWA manifest keeps the legacy path while all SEO URLs
# still point to the Cloudflare canonical origin.
if [[ "$TARGET" == "cloudflare" && -f dist/site.webmanifest ]]; then
  sed -i 's#"start_url": "/sc220-download/"#"start_url": "/"#' dist/site.webmanifest
  sed -i 's#"scope": "/sc220-download/"#"scope": "/"#' dist/site.webmanifest
fi

# Fail the build if an old absolute SEO origin leaks into the deployable site.
if grep -R --line-number --fixed-strings \
  --include='*.html' --include='*.xml' --include='*.txt' --include='*.webmanifest' \
  "$LEGACY_ORIGIN" dist; then
  echo "Legacy canonical origin is still present in dist/." >&2
  exit 1
fi

# Production SEO contract: canonical origin, search-intent hubs, rich schema, and
# static internal links must all exist before either hosting target can deploy.
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/"' dist/index.html
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/download/"' dist/download/index.html
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/en/download/"' dist/en/download/index.html
grep -Fq '"offers":{"@type":"Offer","price":"0"' dist/index.html
grep -Fq 'href="download/">Download resmi</a>' dist/index.html
grep -Fq 'href="sc220-mkii-audio-interface/">Panduan SC220 MKII</a>' dist/index.html
grep -Fq '<title>Driver & Support Recording Tech SC220 MKII – Windows 10/11</title>' dist/sc220-mkii-audio-interface/support/index.html
grep -Fq '<loc>https://sc220.pages.dev/download/</loc>' dist/sitemap.xml

echo "Built SC220 static site for $TARGET with canonical origin $CANONICAL_ORIGIN"