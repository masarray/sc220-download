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

grep -q 'rel="canonical" href="https://sc220.pages.dev/' dist/index.html

echo "Built SC220 static site for $TARGET with canonical origin $CANONICAL_ORIGIN"
