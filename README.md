# SC220 Live Downloads

Official public distribution surface for **SC220 Live** by Recording Tech / MasArray.

This repository contains only the landing page, release metadata, checksums, supply-chain manifest, user-facing release notes, and compiled installer assets. Application source code, debug symbols, private build infrastructure, API credentials, and signing material are not published here.

## Current release

**SC220 Live v0.1.0** — Windows 10/11 x64

- Installer: `SC220-Live-v0.1.0-Setup-win-x64.exe`
- SHA-256: `c8a441f07605f48805233fbddf466312c1de733c647c95705317ad13ee2b7b04`
- Private source authority: commit `3629c5f816159e4a1455220ad51c58362568a29a`
- Standard VB-Audio VB-CABLE is offered as an optional donationware installer task.

The release installer is built and smoke-tested in Windows CI. The included checksum and supply-chain manifest should be used to verify the downloaded file. Windows SmartScreen may still display an unknown-publisher warning until a dedicated application code-signing certificate is deployed.

Official source authority is maintained separately in the private `masarray/sc220-live` repository.
