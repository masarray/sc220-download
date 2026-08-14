#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-}"
REPOSITORY="${GITHUB_REPOSITORY:-masarray/sc220-download}"

if [[ -z "${GH_TOKEN:-}" ]]; then
  echo "GH_TOKEN is required." >&2
  exit 1
fi

if [[ ! -f latest.json ]]; then
  echo "latest.json is required in the repository root." >&2
  exit 1
fi

version="$(jq -r '.version' latest.json)"
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid latest.json version: $version" >&2
  exit 1
fi

tag="v$version"

get_release() {
  gh api "repos/$REPOSITORY/releases/tags/$tag"
}

stage_release() {
  local release release_id is_draft
  release="$(get_release)"
  release_id="$(jq -r '.id' <<<"$release")"
  is_draft="$(jq -r '.draft' <<<"$release")"

  if [[ "$is_draft" != "false" ]]; then
    echo "$tag is still a draft. The verified publish workflow must complete before production staging." >&2
    exit 1
  fi

  echo "Staging $tag as prerelease until the production gate passes."
  gh api --method PATCH "repos/$REPOSITORY/releases/$release_id" \
    -F prerelease=true \
    -f make_latest=false >/dev/null

  release="$(get_release)"
  [[ "$(jq -r '.draft' <<<"$release")" == "false" ]]
  [[ "$(jq -r '.prerelease' <<<"$release")" == "true" ]]
  echo "$tag is staged: public assets remain reachable, but it is not the stable/latest release."
}

promote_release() {
  local release release_id latest_tag
  release="$(get_release)"
  release_id="$(jq -r '.id' <<<"$release")"

  echo "Promoting production-verified $tag to stable/latest."
  gh api --method PATCH "repos/$REPOSITORY/releases/$release_id" \
    -F draft=false \
    -F prerelease=false \
    -f make_latest=true >/dev/null

  release="$(get_release)"
  [[ "$(jq -r '.draft' <<<"$release")" == "false" ]]
  [[ "$(jq -r '.prerelease' <<<"$release")" == "false" ]]

  latest_tag="$(gh api "repos/$REPOSITORY/releases/latest" --jq '.tag_name')"
  if [[ "$latest_tag" != "$tag" ]]; then
    echo "GitHub latest release did not promote to $tag (got $latest_tag)." >&2
    exit 1
  fi

  echo "$tag is production-ready and is now the stable/latest GitHub release."
}

rollback_release() {
  local candidate_release candidate_id releases previous previous_tag previous_version
  local installer checksum_name manifest_name asset_digest checksum_id manifest_id
  local sha256 published download checksum_url manifest_url source_commit manifest_sha current_version

  candidate_release="$(get_release)"
  candidate_id="$(jq -r '.id' <<<"$candidate_release")"

  echo "Production gate failed for $tag; keeping candidate public only as a prerelease."
  gh api --method PATCH "repos/$REPOSITORY/releases/$candidate_id" \
    -F prerelease=true \
    -f make_latest=false >/dev/null

  releases="$(gh api "repos/$REPOSITORY/releases?per_page=100")"
  previous="$(
    jq -c --arg current "$tag" '
      [
        .[]
        | select(
            .draft == false
            and .prerelease == false
            and .tag_name != $current
            and (.tag_name | test("^v[0-9]+\\.[0-9]+\\.[0-9]+$"))
          )
      ]
      | sort_by(.published_at)
      | last // empty
    ' <<<"$releases"
  )"

  if [[ -z "$previous" ]]; then
    echo "No previous stable release exists; refusing to invent rollback metadata." >&2
    exit 1
  fi

  previous_tag="$(jq -r '.tag_name' <<<"$previous")"
  previous_version="${previous_tag#v}"
  installer="SC220-Live-${previous_tag}-Setup-win-x64.exe"
  checksum_name="$installer.sha256"
  manifest_name="SC220-Live-${previous_tag}-Setup-win-x64.manifest.json"

  download="$(jq -r --arg installer "$installer" '.assets[] | select(.name == $installer) | .browser_download_url' <<<"$previous" | head -n1)"
  checksum_url="$(jq -r --arg checksum "$checksum_name" '.assets[] | select(.name == $checksum) | .browser_download_url' <<<"$previous" | head -n1)"
  manifest_url="$(jq -r --arg manifest "$manifest_name" '.assets[] | select(.name == $manifest) | .browser_download_url' <<<"$previous" | head -n1)"
  asset_digest="$(jq -r --arg installer "$installer" '.assets[] | select(.name == $installer) | (.digest // "")' <<<"$previous" | head -n1)"

  if [[ "$asset_digest" =~ ^sha256:([0-9a-fA-F]{64})$ ]]; then
    sha256="${BASH_REMATCH[1],,}"
  else
    checksum_id="$(jq -r --arg checksum "$checksum_name" '.assets[] | select(.name == $checksum) | .id' <<<"$previous" | head -n1)"
    if [[ ! "$checksum_id" =~ ^[0-9]+$ ]]; then
      echo "Cannot recover SHA-256 for previous stable release $previous_tag." >&2
      exit 1
    fi
    gh api -H 'Accept: application/octet-stream' \
      "repos/$REPOSITORY/releases/assets/$checksum_id" > /tmp/sc220-rollback.sha256
    sha256="$(awk '{print tolower($1)}' /tmp/sc220-rollback.sha256 | head -n1)"
  fi

  if [[ ! "$sha256" =~ ^[0-9a-f]{64}$ ]]; then
    echo "Recovered rollback SHA-256 is invalid: $sha256" >&2
    exit 1
  fi

  if [[ -z "$download" || "$download" == "null" ]]; then
    echo "Previous stable installer URL is missing for $previous_tag." >&2
    exit 1
  fi

  if [[ -z "$checksum_url" || "$checksum_url" == "null" || -z "$manifest_url" || "$manifest_url" == "null" ]]; then
    echo "Previous stable checksum/manifest URLs are missing for $previous_tag." >&2
    exit 1
  fi

  manifest_id="$(jq -r --arg manifest "$manifest_name" '.assets[] | select(.name == $manifest) | .id' <<<"$previous" | head -n1)"
  if [[ ! "$manifest_id" =~ ^[0-9]+$ ]]; then
    echo "Previous stable manifest asset is missing for $previous_tag." >&2
    exit 1
  fi
  gh api -H 'Accept: application/octet-stream' \
    "repos/$REPOSITORY/releases/assets/$manifest_id" > /tmp/sc220-rollback.manifest.json
  source_commit="$(jq -r '.source_commit // "" | ascii_downcase' /tmp/sc220-rollback.manifest.json)"
  if [[ ! "$source_commit" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Previous stable source commit is invalid: $source_commit" >&2
    exit 1
  fi
  manifest_sha="$(jq -r '.installer_sha256 // "" | ascii_downcase' /tmp/sc220-rollback.manifest.json)"
  if [[ "$manifest_sha" != "$sha256" ]]; then
    echo "Rollback manifest SHA-256 does not match installer digest." >&2
    exit 1
  fi

  published="$(jq -r '.published_at[0:10]' <<<"$previous")"
  if [[ ! "$published" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    echo "Previous stable published date is invalid: $published" >&2
    exit 1
  fi

  git fetch origin main
  git checkout -B main origin/main

  current_version="$(jq -r '.version' latest.json)"
  if [[ "$current_version" != "$version" ]]; then
    echo "Rollback aborted because main already moved from candidate $version to $current_version." >&2
    exit 1
  fi

  if [[ ! -f "RELEASE_NOTES_${previous_tag}.md" ]]; then
    echo "Missing rollback release notes: RELEASE_NOTES_${previous_tag}.md" >&2
    exit 1
  fi

  jq -n \
    --arg product "SC220 Live" \
    --arg version "$previous_version" \
    --arg published "$published" \
    --arg download "$download" \
    --arg sha256 "$sha256" \
    --arg checksum "$checksum_url" \
    --arg manifest "$manifest_url" \
    --arg source_commit "$source_commit" \
    '{
      product:$product,
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
    }' \
    > latest.json

  git diff --check
  git config user.name github-actions[bot]
  git config user.email 41898282+github-actions[bot]@users.noreply.github.com
  git add latest.json

  if git diff --cached --quiet; then
    echo "latest.json already points to $previous_tag."
  else
    git commit -m "release: rollback production metadata to $previous_tag"
    git push origin HEAD:main
  fi

  echo "Dispatching synchronized rollback deployment for $previous_tag."
  gh workflow run sync-release-landing.yml \
    --repo "$REPOSITORY" \
    --ref main

  echo "Rollback queued: $tag remains prerelease and production metadata is returning to $previous_tag."
}

case "$ACTION" in
  stage) stage_release ;;
  promote) promote_release ;;
  rollback) rollback_release ;;
  *)
    echo "Usage: $0 {stage|promote|rollback}" >&2
    exit 2
    ;;
esac
