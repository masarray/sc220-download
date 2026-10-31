# SC220 Live portable preview: Linux x64 + macOS universal

**Official distribution:** [masarray/sc220-download](https://github.com/masarray/sc220-download/releases)

This is a **public prerelease for limited functional testing**. The Windows
v0.1.2 stable release stays unchanged, and the portable preview is excluded
from `latest.json`, the official Windows download buttons, and production
promotion/deployment gates.

## Deliverables

- Linux x86_64: `SC220-Live-v0.1.2-portable-preview.N-linux-x64.tar.gz`
- macOS Intel/Apple Silicon: `SC220-Live-v0.1.2-portable-preview.N-macos-universal.dmg`
- One SHA-256 file for each binary package.
- `BUILD_COMMIT.txt`: the exact private `masarray/sc220-live` source commit.
- `PORTABLE_RELEASE_MANIFEST.json`: artifact hashes, sizes, provenance and
  platform/feature scope.

Only compiled application binaries, license text, public instructions,
checksums and a manifest may be uploaded. **Never** upload the full source
checkout, private DSP submodule, debug symbols, credentials or cached sources
to public GitHub Actions artifacts or GitHub Releases.

## Current limitations

SC220 Live originally targeted Windows 10/11. The GUI and processing graph
are implemented in JUCE, but the following Windows-specific paths are not
ported to Linux/macOS:

- **PC Audio loopback capture:** Windows WASAPI render endpoint capture.
  The macOS/Linux preview deliberately disables this lane; selecting
  BlackHole, JACK or PipeWire does not implicitly create a loopback capture.
- **Independent physical Monitor Bus:** only the Windows WASAPI monitor backend
  is implemented. The independent monitor is unavailable on macOS/Linux.
- **Runtime/driver parity:** SC220 detection, virtual device routing, latency,
  dropouts and reconnection behavior still require hardware qualification.
- **macOS security:** `.app` is ad-hoc signed for testing, not Developer ID
  signed or notarized. Gatekeeper may require a trusted manual launch.
- **Linux distribution:** portable x64 archive targeting Ubuntu 24.04; not
  an AppImage/.deb or guarantee of support on every desktop distribution.

These are **not feature-parity production releases**. Do not market them as
fully working Windows equivalents. The 365-day license logic and pinned
ASK-P authority remain the source application's existing implementations.

## Install for acceptance testing

For Linux, extract the `.tar.gz`, open the directory in a desktop session,
and execute `./SC220\ Live`. Install compatible ALSA/JACK drivers and other
runtime libraries as needed.

For macOS, open the `.dmg`, copy `SC220 Live.app` to Applications, and
only launch after checking the checksum and trusting the preview publisher.
Review macOS Microphone permissions and compatible SC220 USB-audio interfaces.

Before any live use, verify the actual audio input/output, begin muted at
low volume, exercise bypass and faders, measure input/output latency,
disconnect/reconnect the SC220, and confirm no recursive feedback.
PC Music capture and independent monitoring are **not** available yet.

## Official public CI and release path

The source code resides only in private `masarray/sc220-live`; the CI/release
controller resides in public `masarray/sc220-download`.

Workflow: [Build SC220 Live Linux/macOS (official download release)](../.github/workflows/build-portable-release.yml).

The public repository requires an Actions secret **`SC220_SOURCE_TOKEN`**
whose credential has **read-only Contents** access to both private
`masarray/sc220-live` and `masarray/askp-vst`. Restrict token scope to those
repositories and rotate it according to the organization's security policy.
The workflow runs only for trusted pushes to public `main` (build check) or
explicit manual dispatch; there is no untrusted PR trigger with secret access.

The workflow checks private `main` SHA and the pinned ASK-P v0.5.24 DSP SHA,
builds native Linux/macOS in parallel, runs CTest, packages with the private
`scripts/package-portable.sh` helper, and validates SHA-256. Only after both
jobs pass can a manually approved dispatch with `publish_release=true`
create a new **prerelease in sc220-download**.

The dispatch's `source_sha` input must be the exact current private
`sc220-live/main` SHA. Use a fresh unused tag such as
`v0.1.2-portable-preview.1`, never overwrite an existing tag. The release
must remain `prerelease=true` and `make_latest=false`, preserving stable
Windows v0.1.2.

**Existing Windows workflow is unchanged.** The production
`publish-draft-release.yml` pipeline intentionally verifies an exact
Windows Inno Setup installer allowlist. This supplementary platform job
does not loosen that gate, does not modify `latest.json`, and does not
promote any preview to the public website.

GitHub-hosted CI can prove native compilation and compiled audits, but only
real Linux/macOS device acceptance tests can establish complete runtime
correctness and production readiness.
