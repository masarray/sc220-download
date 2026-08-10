# SC220 Live v0.1.1

Rilis stabil Windows terbaru untuk SC220 Live, diterbitkan **10 Agustus 2026**, dengan engine pemrosesan yang disinkronkan ke baseline produksi ASK-P terbaru, smart installer yang lebih matang, dan distribusi publik yang lebih robust.

## Pembaruan utama

- Engine pemrosesan internal disinkronkan ke authority produksi **ASK-P v0.5.24** yang disetujui.
- Reference Bypass memakai jalur input bersama yang selaras latensi dengan transisi halus.
- Installer memeriksa Microsoft Visual C++ Runtime, layanan Windows Audio, dan kesiapan VB-CABLE sebelum aplikasi dijalankan.
- Analyzer stereo mempertahankan pembacaan konten anti-phase dengan analisis energi kanal kiri dan kanan secara terpisah.
- Perbaikan kompilasi template installer dan kontrak regresi release memperkuat packaging serta verifikasi distribusi.
- Tidak ada kontrol Gain Match baru di SC220 Live: **Gain Match tetap OFF secara default dan tidak diekspos di UI publik**.

## Instalasi

1. Unduh `SC220-Live-v0.1.1-Setup-win-x64.exe` dari halaman resmi atau GitHub Release v0.1.1.
2. Jalankan installer sebagai Administrator.
3. Ikuti pemeriksaan prasyarat otomatis.
4. Pasang Standard VB-Audio VB-CABLE hanya bila workflow streaming Anda memerlukannya.
5. Restart Windows bila installer runtime atau driver memintanya.
6. Untuk OBS atau TikTok Live Studio, gunakan `CABLE Output` sebagai input audio jika routing VB-CABLE diaktifkan.

## Integritas

- Installer: `SC220-Live-v0.1.1-Setup-win-x64.exe`
- Ukuran installer: `24,043,506` byte (sekitar 22,9 MiB)
- Installer SHA-256: `589b174357cb36c62611d7a0e89bfa6a7d25251fc27015b5dd5b25fb54c04686`
- Private source commit: `994b983a7f02b6a2285c41781ecb77dc07e3b217`
- Microsoft VC++ Runtime SHA-256: `843068991daaa1f73ad9f6239bce4d0f6a07a51f18c37ea2a867e9beca71295c`
- VB-CABLE Pack45 SHA-256: `b950e39f01af1d04ea623c8f6d8eb9b6ea5c477c637295fabf20631c85116bfb`
- Platform: Windows 10/11 x64

Distribusi publik hanya berisi installer biner, checksum, manifest, provenance hash, dan dokumentasi end-user. Source code aplikasi, source DSP, submodule privat, generator, simbol debug, credential, serta material signing tidak disertakan.

Windows SmartScreen dapat tetap menampilkan peringatan unknown publisher sampai sertifikat code-signing aplikasi tersedia. Unduh hanya dari sumber resmi dan verifikasi SHA-256 bila diperlukan.
