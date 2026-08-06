# Contributing to SC220 Live Public Distribution

Thank you for helping improve the public SC220 Live experience.

This repository is intentionally limited to the public website, documentation, release metadata, checksums, manifests, issue templates, and distribution automation. The proprietary application source code is maintained separately.

## Contributions accepted here

- Landing-page corrections and accessibility improvements.
- English or Indonesian documentation improvements.
- Broken-link and metadata fixes.
- Release-note corrections.
- Support and troubleshooting documentation.
- GitHub Pages workflow improvements that do not expose private infrastructure.
- Reproducible public bug reports and feature requests.

## Out of scope

- Requests to publish private application source code.
- Proprietary DSP implementation changes.
- Signing keys, certificates, credentials, or build secrets.
- Repackaged installers or third-party binaries.
- Unverified product claims, fabricated benchmarks, ratings, or testimonials.

## Reporting a bug

Use the repository's structured bug-report form and include:

- SC220 Live version.
- Windows version/build.
- Audio hardware and driver type.
- Streaming application and version.
- Reproduction steps.
- Expected and actual behavior.
- Sanitized screenshots or logs.

Security issues must follow [SECURITY.md](SECURITY.md) and must not be posted publicly.

## Documentation and website pull requests

1. Create a focused branch.
2. Keep the change limited to one clear purpose.
3. Preserve the Indonesian and English language relationship where applicable.
4. Use concise, factual wording and avoid keyword stuffing.
5. Keep links relative for repository files and absolute for the production website.
6. Do not modify release checksums or installer metadata unless a new official release is being published.
7. Verify that HTML, JSON-LD, sitemap XML, and JSON files remain valid.

## Pull request checklist

- [ ] The change has a clear user benefit.
- [ ] English and Indonesian pages remain consistent where applicable.
- [ ] No credentials, personal data, or private infrastructure details are included.
- [ ] Download links point only to official GitHub Releases.
- [ ] Claims are accurate and can be verified.
- [ ] Existing release metadata and checksums were not changed accidentally.
- [ ] Links, headings, and images render correctly on GitHub and GitHub Pages.

## Style

- Prefer plain international English for the main README and public technical documentation.
- Keep Indonesian translations natural rather than literal.
- Use descriptive headings and short paragraphs.
- Avoid excessive badges, decorative symbols, or promotional language.
- Distinguish clearly between Recording Tech SC220, KTV Pro K500, and SC220 Live.

By contributing, you agree that your submitted documentation or website changes may be published in this public repository.
