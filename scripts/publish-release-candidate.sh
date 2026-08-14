#!/usr/bin/env bash
set -euo pipefail

REPOSITORY="${GITHUB_REPOSITORY:-masarray/sc220-download}"
VERSION="${VERSION:-${1:-}}"

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "GH_TOKEN is required." >&2
  exit 1
fi
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid semantic version: $VERSION" >&2
  exit 1
fi

tag="v$VERSION"
installer="SC220-Live-$tag-Setup-win-x64.exe"
checksum="$installer.sha256"
manifest="SC220-Live-$tag-Setup-win-x64.manifest.json"
expected=(
  "$installer"
  "$checksum"
  "$manifest"
  "BUILD_COMMIT.txt"
  "VC_REDIST_X64_SHA256.txt"
  "VB_CABLE_PACK45_SHA256.txt"
)

release_json="$(gh api "repos/$REPOSITORY/releases/tags/$tag")"
if [[ "$(jq -r '.draft' <<<"$release_json")" != "true" ]]; then
  echo "$tag is already published. Atomic publication refuses to demote or republish an existing release." >&2
  exit 1
fi
release_id="$(jq -r '.id' <<<"$release_json")"
if [[ ! "$release_id" =~ ^[0-9]+$ ]]; then
  echo "Draft release id is invalid: $release_id" >&2
  exit 1
fi

previous_latest_tag="$(gh api "repos/$REPOSITORY/releases/latest" --jq '.tag_name' 2>/dev/null || true)"
if [[ -n "$previous_latest_tag" ]]; then
  if [[ ! "$previous_latest_tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Existing latest release has an unexpected tag: $previous_latest_tag" >&2
    exit 1
  fi
  if [[ "$previous_latest_tag" == "$tag" ]]; then
    echo "$tag is already the stable/latest release; refusing duplicate publication." >&2
    exit 1
  fi
  python3 - "$VERSION" "${previous_latest_tag#v}" <<'PY'
import sys
candidate = tuple(map(int, sys.argv[1].split('.')))
current = tuple(map(int, sys.argv[2].split('.')))
if candidate <= current:
    raise SystemExit(f"Candidate version {sys.argv[1]} must be newer than current stable {sys.argv[2]}.")
PY
fi

mapfile -t actual < <(jq -r '.assets[].name' <<<"$release_json" | sort)
mapfile -t wanted < <(printf '%s\n' "${expected[@]}" | sort)
if [[ "${actual[*]}" != "${wanted[*]}" ]]; then
  echo "Draft assets do not match the binary-only allowlist." >&2
  printf 'Expected: %s\n' "${wanted[*]}" >&2
  printf 'Actual:   %s\n' "${actual[*]}" >&2
  exit 1
fi

mkdir -p release-assets
while IFS=$'\t' read -r asset_id asset_name; do
  gh api -H 'Accept: application/octet-stream' \
    "repos/$REPOSITORY/releases/assets/$asset_id" \
    > "release-assets/$asset_name"
done < <(jq -r '.assets[] | [.id, .name] | @tsv' <<<"$release_json")

pushd release-assets >/dev/null
expected_hash="$(awk '{print tolower($1)}' "$checksum")"
actual_hash="$(sha256sum "$installer" | awk '{print $1}')"
[[ "$expected_hash" =~ ^[0-9a-f]{64}$ ]]
[[ "$actual_hash" == "$expected_hash" ]]
grep -Fq "$installer" "$checksum"

jq -e --arg version "$VERSION" --arg file "$installer" --arg hash "$actual_hash" '
  .product == "SC220 Live" and
  .version == $version and
  .installer_file == $file and
  (.source_commit | test("^[0-9a-fA-F]{40}$")) and
  (.installer_sha256 | ascii_downcase) == $hash and
  (.vc_runtime.sha256 | test("^[0-9a-fA-F]{64}$")) and
  (.vb_cable.sha256 | test("^[0-9a-fA-F]{64}$"))
' "$manifest" >/dev/null

build_commit="$(tr -d '\r\n ' < BUILD_COMMIT.txt | tr '[:upper:]' '[:lower:]')"
vc_hash="$(tr -d '\r\n ' < VC_REDIST_X64_SHA256.txt | tr '[:upper:]' '[:lower:]')"
vb_hash="$(tr -d '\r\n ' < VB_CABLE_PACK45_SHA256.txt | tr '[:upper:]' '[:lower:]')"
[[ "$build_commit" =~ ^[0-9a-f]{40}$ ]]
[[ "$vc_hash" =~ ^[0-9a-f]{64}$ ]]
[[ "$vb_hash" =~ ^[0-9a-f]{64}$ ]]
[[ "$build_commit" == "$(jq -r '.source_commit | ascii_downcase' "$manifest")" ]]
[[ "$vc_hash" == "$(jq -r '.vc_runtime.sha256 | ascii_downcase' "$manifest")" ]]
[[ "$vb_hash" == "$(jq -r '.vb_cable.sha256 | ascii_downcase' "$manifest")" ]]

if strings -a "$installer" | grep -Ei \
  'third_party[/\\]askp-vst|PluginProcessor\.(cpp|h)|PluginEditor\.(cpp|h)|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'; then
  echo "Private ASK-P source path or key material was found in the installer." >&2
  exit 1
fi
popd >/dev/null

release_base="https://github.com/$REPOSITORY/releases/download/$tag"
published="$(date -u +%F)"
jq -n \
  --arg version "$VERSION" \
  --arg published "$published" \
  --arg download "$release_base/$installer" \
  --arg sha256 "$actual_hash" \
  --arg checksum "$release_base/$checksum" \
  --arg manifest "$release_base/$manifest" \
  --arg source_commit "$build_commit" \
  '{
    product:"SC220 Live",
    version:$version,
    published:$published,
    platform:"windows-x64",
    status:"stable",
    download:$download,
    sha256:$sha256,
    checksum:$checksum,
    manifest:$manifest,
    source_commit:$source_commit,
    smart_installer:true,
    vc_runtime_bundled:true,
    vb_cable_optional:true
  }' > latest.json

gh release view "$tag" --repo "$REPOSITORY" --json body --jq '.body' > "RELEASE_NOTES_$tag.md"

git config user.name github-actions[bot]
git config user.email 41898282+github-actions[bot]@users.noreply.github.com
git add latest.json "RELEASE_NOTES_$tag.md"
if ! git diff --cached --quiet; then
  git commit -m "release: stage website metadata for SC220 Live $tag"
fi

candidate="$(
  gh api --method PATCH "repos/$REPOSITORY/releases/$release_id" \
    -F draft=false \
    -F prerelease=true \
    -f make_latest=false
)"
if [[ "$(jq -r '.draft' <<<"$candidate")" != "false" ]]; then
  echo "$tag remained a draft after candidate publication." >&2
  exit 1
fi
if [[ "$(jq -r '.prerelease' <<<"$candidate")" != "true" ]]; then
  echo "Atomic release violation: $tag was not published as a prerelease." >&2
  exit 1
fi

latest_tag="$(gh api "repos/$REPOSITORY/releases/latest" --jq '.tag_name' 2>/dev/null || true)"
if [[ "$latest_tag" != "$previous_latest_tag" ]]; then
  echo "Atomic release violation: stable/latest changed from '$previous_latest_tag' to '$latest_tag' before production verification." >&2
  exit 1
fi

git push origin HEAD:main

candidate="$(gh api "repos/$REPOSITORY/releases/tags/$tag")"
latest_tag="$(gh api "repos/$REPOSITORY/releases/latest" --jq '.tag_name' 2>/dev/null || true)"
[[ "$(jq -r '.draft' <<<"$candidate")" == "false" ]]
[[ "$(jq -r '.prerelease' <<<"$candidate")" == "true" ]]
[[ "$(jq -r '.published_at' <<<"$candidate")" != "null" ]]
[[ "$latest_tag" == "$previous_latest_tag" ]]
[[ "$(jq -r --arg file "$installer" '.assets[] | select(.name == $file) | .digest' <<<"$candidate")" == "sha256:$actual_hash" ]]

echo "Published $tag as a verified prerelease candidate. Stable/latest remains ${previous_latest_tag:-unset} until the production gate succeeds."