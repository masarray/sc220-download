#!/usr/bin/env bash
set -euo pipefail

ORIGIN="${1:-https://sc220.pages.dev}"
ORIGIN="${ORIGIN%/}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"

fetch() {
  local path="$1"
  local output="$2"
  echo "Checking ${ORIGIN}${path}"
  curl --fail --location --silent --show-error \
    --retry 10 --retry-delay 3 --retry-all-errors \
    --connect-timeout 10 --max-time 30 \
    "${ORIGIN}${path}" -o "$output"
}

assert_equal() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$expected" != "$actual" ]]; then
    echo "Production release contract mismatch for ${label}: expected '${expected}', got '${actual}'." >&2
    exit 1
  fi
}

fetch "/latest.json" "$TMP_DIR/latest.json"
fetch "/" "$TMP_DIR/index.html"
fetch "/en/" "$TMP_DIR/en.html"
fetch "/download/" "$TMP_DIR/download.html"
fetch "/en/download/" "$TMP_DIR/download-en.html"
fetch "/sc220-mkii-audio-interface/support/" "$TMP_DIR/support.html"
fetch "/sitemap.xml" "$TMP_DIR/sitemap.xml"
fetch "/robots.txt" "$TMP_DIR/robots.txt"
fetch "/app.js" "$TMP_DIR/app.js"

echo "Checking ${ORIGIN}/assets/screenshot/Screenshot.webp"
curl --fail --location --silent --show-error \
  --retry 10 --retry-delay 3 --retry-all-errors \
  --connect-timeout 10 --max-time 30 \
  --dump-header "$TMP_DIR/screenshot.headers" \
  "${ORIGIN}/assets/screenshot/Screenshot.webp" \
  -o "$TMP_DIR/Screenshot.webp"

source_version="$(jq -r '.version' latest.json)"
source_published="$(jq -r '.published' latest.json)"
source_download="$(jq -r '.download' latest.json)"
source_sha256="$(jq -r '.sha256' latest.json)"
source_product="$(jq -r '.product' latest.json)"

live_version="$(jq -r '.version' "$TMP_DIR/latest.json")"
live_published="$(jq -r '.published' "$TMP_DIR/latest.json")"
live_download="$(jq -r '.download' "$TMP_DIR/latest.json")"
live_sha256="$(jq -r '.sha256' "$TMP_DIR/latest.json")"
live_product="$(jq -r '.product' "$TMP_DIR/latest.json")"

assert_equal "product" "$source_product" "$live_product"
assert_equal "version" "$source_version" "$live_version"
assert_equal "published" "$source_published" "$live_published"
assert_equal "download" "$source_download" "$live_download"
assert_equal "sha256" "$source_sha256" "$live_sha256"

tag="v${source_version}"

# Homepage release contract: live metadata, direct download, checksum, and current screenshot.
for page in "$TMP_DIR/index.html" "$TMP_DIR/en.html"; do
  grep -Fq "\"softwareVersion\":\"$source_version\"" "$page"
  grep -Fq "\"datePublished\":\"$source_published\"" "$page"
  grep -Fq "$source_download" "$page"
  grep -Fq "$source_sha256" "$page"
  grep -Fq "data-version>${tag}" "$page"
done

grep -Fq 'src="assets/screenshot/Screenshot.webp"' "$TMP_DIR/index.html"
grep -Fq 'src="../assets/screenshot/Screenshot.webp"' "$TMP_DIR/en.html"
grep -Fq '"screenshot":"https://sc220.pages.dev/assets/screenshot/Screenshot.webp"' "$TMP_DIR/index.html"
grep -Fq '"screenshot":"https://sc220.pages.dev/assets/screenshot/Screenshot.webp"' "$TMP_DIR/en.html"

# Dedicated download pages must expose the same release authority.
for page in "$TMP_DIR/download.html" "$TMP_DIR/download-en.html"; do
  grep -Fq "\"softwareVersion\":\"$source_version\"" "$page"
  grep -Fq "\"datePublished\":\"$source_published\"" "$page"
  grep -Fq "$source_download" "$page"
  grep -Fq "$source_sha256" "$page"
done

# JavaScript fallback must never lag behind latest.json.
grep -Fq "version: \"$source_version\"" "$TMP_DIR/app.js"
grep -Fq "published: \"$source_published\"" "$TMP_DIR/app.js"
grep -Fq "download: \"$source_download\"" "$TMP_DIR/app.js"
grep -Fq "sha256: \"$source_sha256\"" "$TMP_DIR/app.js"
grep -Fq 'const siteBase = isGitHubPagesMirror ? "/sc220-download/" : "/";' "$TMP_DIR/app.js"

# Screenshot asset must be present and served as WebP.
test -s "$TMP_DIR/Screenshot.webp"
tr -d '\r' < "$TMP_DIR/screenshot.headers" | grep -Eiq '^content-type:[[:space:]]*image/webp([[:space:]]*;.*)?$'

# Canonical SEO and support intent remain part of the production contract.
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/"' "$TMP_DIR/index.html"
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/en/"' "$TMP_DIR/en.html"
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/download/"' "$TMP_DIR/download.html"
grep -Fq 'rel="canonical" href="https://sc220.pages.dev/en/download/"' "$TMP_DIR/download-en.html"
grep -Fq '"@type":"SoftwareApplication"' "$TMP_DIR/download.html"
grep -Fq '"offers":{"@type":"Offer","price":"0"' "$TMP_DIR/download.html"
grep -Fq '<title>Driver & Support Recording Tech SC220 MKII – Windows 10/11</title>' "$TMP_DIR/support.html"
grep -Fq '<loc>https://sc220.pages.dev/download/</loc>' "$TMP_DIR/sitemap.xml"
grep -Fq '<loc>https://sc220.pages.dev/en/download/</loc>' "$TMP_DIR/sitemap.xml"
grep -Fq 'Sitemap: https://sc220.pages.dev/sitemap.xml' "$TMP_DIR/robots.txt"

# The advertised installer itself must still resolve from the public release URL.
echo "Checking installer asset ${source_download}"
curl --fail --location --silent --show-error --head \
  --retry 5 --retry-delay 2 --retry-all-errors \
  --connect-timeout 10 --max-time 30 \
  "$source_download" >/dev/null

echo "Production release contract passed for ${source_product} ${tag}: metadata, download URLs, checksum, Screenshot.webp, canonical SEO, and installer reachability are live."
