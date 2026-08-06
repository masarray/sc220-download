# SC220 Live Support

This repository provides public support for the SC220 Live installer, landing page, release metadata, and documented Windows audio workflow.

## Before opening an issue

Please confirm all of the following:

1. You downloaded SC220 Live from the [official release page](https://github.com/masarray/sc220-download/releases/latest).
2. The installer SHA-256 matches the checksum published in the release.
3. Windows recognizes the Recording Tech SC220 or your selected audio device.
4. The correct input and playback devices are selected in SC220 Live.
5. Another application is not exclusively locking the same audio device.
6. The issue still occurs after restarting SC220 Live and the affected audio devices.
7. You tested with conservative input/output levels and without unnecessary processing stages.

## Supported issue types

Open a public issue for:

- Reproducible application crashes or startup failures.
- Audio device detection or routing problems.
- Incorrect meters, faders, mute, ducking, or stream-output behavior.
- Installer or release-integrity problems.
- Broken links, documentation mistakes, or landing-page accessibility problems.

Use the structured [bug report form](https://github.com/masarray/sc220-download/issues/new?template=bug-report.yml) so the report includes the information needed for diagnosis.

## Information to include

- SC220 Live version.
- Windows version and build.
- Audio device name and driver type.
- Streaming application and version.
- Exact steps to reproduce the problem.
- Expected and actual behavior.
- Screenshots or short logs with personal information removed.
- Whether the problem happens before or after enabling the stream output.

## Not handled in public issues

Do not post:

- License keys, activation identifiers, credentials, or private account data.
- Security vulnerabilities or exploit details. Follow [SECURITY.md](SECURITY.md).
- Third-party software binaries or copyrighted firmware.
- Requests for private application source code, signing keys, or proprietary DSP implementation details.

## Common situations

### Windows SmartScreen warning

A warning may appear while the installer is not signed with a dedicated application code-signing certificate. Download only from the official release page and verify SHA-256 before running it.

### No signal in OBS or TikTok Live Studio

Confirm that the virtual output used by SC220 Live is selected as the input device in the streaming application. Also confirm that the virtual audio route is installed, enabled, and using a compatible sample rate.

### Device appears in Windows but not in SC220 Live

Close other applications that may hold the device exclusively, reconnect the hardware, restart SC220 Live, and confirm the device is enabled in Windows Sound settings.

### Audio sounds unstable, pumping, or distorted

Reduce gain at the earliest stage, avoid stacking multiple compressors or limiters, and confirm that no stage is clipping. Test the hardware loopback or clean reference path before adding DSP.

## Response expectations

This is a maintained public distribution repository, but support is provided on a best-effort basis. Clear, reproducible reports with complete hardware and software details are prioritized.
