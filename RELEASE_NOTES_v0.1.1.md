# SC220 Live v0.1.1

Rilis Windows terbaru dengan engine pemrosesan yang diperbarui, installer pintar, dan perbaikan kestabilan distribusi.

## Pembaruan utama

- Engine pemrosesan internal disinkronkan ke baseline produksi terbaru.
- Reference Bypass memakai jalur input bersama yang selaras latensi dengan transisi halus.
- Installer memeriksa Microsoft Visual C++ Runtime, layanan Windows Audio, dan kesiapan VB-CABLE sebelum aplikasi dijalankan.
- Analyzer stereo mempertahankan pembacaan konten anti-phase dengan analisis energi kanal kiri dan kanan secara terpisah.
- Perbaikan kompilasi template installer dan kontrak regresi release.

## Instalasi

1. Unduh `SC220-Live-v0.1.1-Setup-win-x64.exe`.
2. Jalankan installer sebagai Administrator.
3. Ikuti pemeriksaan prasyarat otomatis.
4. Restart Windows bila installer runtime atau driver memintanya.
5. Untuk OBS atau TikTok Live Studio, gunakan `CABLE Output` sebagai input audio jika routing VB-CABLE diaktifkan.

## Integritas

- Installer SHA-256: `589b174357cb36c62611d7a0e89bfa6a7d25251fc27015b5dd5b25fb54c04686`
- Private source commit: `994b983a7f02b6a2285c41781ecb77dc07e3b217`
- Microsoft VC++ Runtime SHA-256: `843068991daaa1f73ad9f6239bce4d0f6a07a51f18c37ea2a867e9beca71295c`
- VB-CABLE Pack45 SHA-256: `b950e39f01af1d04ea623c8f6d8eb9b6ea5c477c637295fabf20631c85116bfb`
- Platform: Windows 10/11 x64

Distribusi publik hanya berisi installer biner, checksum, manifest, dan provenance hash. Source code, submodule, generator, simbol debug, serta material signing privat tidak disertakan.

Windows SmartScreen dapat tetap menampilkan peringatan unknown publisher sampai sertifikat code-signing aplikasi tersedia.

