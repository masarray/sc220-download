# SC220 Live Support

This repository provides public, best-effort support for the SC220 Live installer, landing pages, release metadata, documented Windows audio workflow, and reproducible device-detection or routing behavior.

## Start here

- [SC220 Live landing page](https://masarray.github.io/sc220-download/)
- [Recording Tech SC220 MKII hardware guide](https://masarray.github.io/sc220-download/sc220-mkii-audio-interface/)
- [SC220 MKII goal-based setup and gain staging](https://masarray.github.io/sc220-download/sc220-mkii-audio-interface/setup/)
- [SC220 MKII diagnostic checklist and issue template](https://masarray.github.io/sc220-download/sc220-mkii-audio-interface/support/)
- [Official SC220 Live releases](https://github.com/masarray/sc220-download/releases/latest)

## Before opening an issue

Confirm and record the following:

1. SC220 Live was downloaded from the official release page.
2. The installer SHA-256 matches the checksum published in the release.
3. The exact hardware model printed on the chassis or package is known.
4. Windows recognizes the audio interface or selected audio device.
5. The correct input, playback source, and stream output are selected.
6. Another application is not exclusively locking the same device.
7. The problem remains after reconnecting the hardware and restarting the affected applications.
8. The signal was tested with conservative gain and unnecessary DSP or routing stages disabled.
9. A simple hardware → Windows → one application path was tested before adding SC220 Live, VB-CABLE, OBS, or TikTok Live Studio.

## Supported issue types

Open a public issue for:

- Reproducible SC220 Live crashes or startup failures.
- Audio-device detection, reconnect, channel mapping, or routing problems.
- Incorrect meters, faders, mute, ducking, or stream-output behavior.
- Installer or release-integrity problems.
- Broken links, metadata, documentation, accessibility, or landing-page issues.
- Reproducible compatibility findings from a clearly identified SC220 or SC220 MKII unit.

Use the structured [bug report form](https://github.com/masarray/sc220-download/issues/new?template=bug-report.yml).

## Evidence required for SC220 / SC220 MKII reports

### Hardware identity

- Model exactly as printed on the device or packaging.
- Front and rear panel photos with labels visible.
- USB cable type and whether it is a proven data cable.
- Direct USB port, hub, dock, or OTG adapter.
- Whether the behavior changes after moving ports or reconnecting.

### Source and wiring

- Dynamic microphone, condenser microphone, instrument, mixer, or karaoke processor.
- Input number and connector type.
- Mic, Line, or Instrument mode.
- +48 V status and why it is enabled.
- PAD status.
- Complete signal path from source to headphones, speakers, SC220 Live, and the broadcast application.

### Windows

- Windows edition, version, and OS build.
- Device Manager name.
- Windows Sound input and output names.
- Visible input/output channel count.
- Selected sample rate and bit depth.
- Audio API or driver actually used, such as Windows audio, WASAPI, or ASIO when available.
- Whether the device survives sleep, wake, reconnect, and application restart.

### Software and routing

- SC220 Live version.
- OBS, TikTok Live Studio, DAW, or other application version.
- Selected hardware input, playback source, and stream output.
- Screenshots of meters at the hardware, SC220 Live, and destination stages.
- Whether the same source is captured twice.
- Whether the failure starts before or after enabling stream output.

## Recommended diagnostic order

1. **Hardware only:** source → SC220 → headphones/direct monitor when available.
2. **Windows input:** verify endpoint, Windows meter, sample rate, and microphone permissions.
3. **One application:** capture with one application, no DSP, no virtual cable, and no duplicate monitoring.
4. **SC220 Live:** add routing, faders, meters, DSP, and stream output one stage at a time.
5. **Broadcast chain:** add OBS or TikTok Live Studio and make a short test recording.

Do not raise several gain stages or change several routing settings at the same time.

## Issue template

Copy this structure into a report when the structured form does not cover the case:

```markdown
## Problem summary

## Hardware model
- Model printed on label:
- Front/rear panel photos:
- USB cable type:
- Direct port / hub / dock:

## Source and wiring
- Source type:
- Input used:
- Mic/Line/Instrument mode:
- +48 V:
- PAD:
- Complete wiring:

## Windows
- Edition/version/build:
- Device Manager name:
- Windows Sound endpoint names:
- Input/output channel count:
- Sample rate / bit depth:
- Audio driver/API:

## Software
- SC220 Live version:
- OBS/TikTok/DAW version:
- Selected input:
- Playback source:
- Stream output:

## Reproduction steps
1.
2.
3.

## Expected result

## Actual result

## Meters and evidence
- Hardware meter:
- SC220 Live meter:
- Destination meter:
- Screenshot/log with private data removed:

## Tests completed
- Another cable/port:
- Without hub:
- Restart/reconnect:
- DSP disabled:
- Direct monitor only:
- Other applications closed:
```

## Common situations

### Windows SmartScreen warning

A warning may appear while the installer is not signed with a dedicated application code-signing certificate. Download only from the official release page and verify SHA-256 before running it.

### Device appears in Windows but not in SC220 Live

Close applications that may hold the device exclusively, reconnect the interface, restart SC220 Live, and confirm that the endpoint is enabled in Windows Sound settings. Include the exact endpoint name in the issue.

### Microphone appears only on the left or right

A microphone connected to one hardware input is normally a mono source. Select a mono input or enable mono handling in the destination application instead of assuming the interface is faulty.

### Echo or doubled audio

Direct monitoring and software monitoring may both be active, or the same source may be captured directly and again through SC220 Live or a virtual cable.

### Audio sounds unstable, pumping, or distorted

Reduce gain at the earliest stage, disable stacked compressors or limiters, and confirm that no input or intermediate stage is clipping. Test a clean reference path before adding DSP.

### Unofficial drivers

Do not install a driver binary that cannot be clearly tied to the hardware vendor, exact model, and a verifiable source. Record the Windows hardware identity first. This repository does not distribute third-party drivers or firmware.

## Not handled in public issues

Do not post:

- License keys, activation identifiers, credentials, private email addresses, or account data.
- Security vulnerabilities or exploit details. Follow [SECURITY.md](SECURITY.md).
- Third-party software binaries, copyrighted firmware, or unofficial drivers.
- Requests for private application source code, signing keys, or proprietary DSP implementation details.

## Response expectations

Clear, reproducible reports with complete hardware, Windows, wiring, and software evidence are prioritized. Hardware specifications, driver support, loopback, ASIO behavior, endpoint names, mobile power requirements, and SC220 Live compatibility are not treated as verified until they are supported by official documentation or a repeatable physical-unit test.
