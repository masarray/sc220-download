# SC220 Live v0.1.0

First public Windows release of SC220 Live for Recording Tech SC220.

## Highlights

- Mix SC220 input and selectable Windows PC playback audio in one live console.
- ASK-P Signature processing with Enhance, Smart Bass, Smart Treble, Vocal Body, Stereo Magic, and smart protection.
- Automatic ducking of PC audio from the SC220 voice key.
- Real Windows Stream Output endpoint names; no synthetic `VB-CABLE 2/3` aliases.
- Dedicated physical Monitor Output with anti-feedback routing protection.
- Responsive programme analyzer, LUFS-I loudness, true-peak monitoring, meters, faders, mute, and Go Live controls.
- Event-driven WASAPI PC capture with fallback, reconnect, and honest silence/error telemetry.

## Installation

1. Download `SC220-Live-v0.1.0-Setup-win-x64.exe`.
2. Run the installer as Administrator.
3. Standard **VB-Audio VB-CABLE** is offered as an optional donationware installer task. Leave it unchecked when a compatible cable is already installed.
4. Restart Windows when the VB-CABLE driver is installed or repaired.
5. In SC220 Live, select the real Windows PC Audio Source, `CABLE Input` as Stream Output, and a separate physical speaker/headphone only when monitoring is required.
6. In OBS or TikTok Live Studio, select `CABLE Output` as the audio input.

## Integrity

- Installer SHA-256: `c8a441f07605f48805233fbddf466312c1de733c647c95705317ad13ee2b7b04`
- Private source authority: `3629c5f816159e4a1455220ad51c58362568a29a`
- VB-CABLE Pack45 SHA-256: `b950e39f01af1d04ea623c8f6d8eb9b6ea5c477c637295fabf20631c85116bfb`
- Windows 10/11 x64

The installer was built, smoke-installed, smoke-uninstalled, and validated in Windows CI. Verify the SHA-256 after download. Windows SmartScreen may display an unknown-publisher warning until a dedicated application code-signing certificate is deployed.

## Licence

SC220 Live provides full creative control for 365 days. After that period, audio, routing, faders, meters, mute, and ducking continue to operate; ASK-P presets and the five creative macro controls become read-only unless permanently unlocked.

SC220 Live is proprietary software. The optional VB-Audio VB-CABLE component remains donationware and is distributed with its own notice and unchanged signed driver package.
