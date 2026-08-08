# SEO next-level architecture

Production SEO authority: `https://sc220.pages.dev`

Primary intent hubs:

- `/` — SC220 Live product / karaoke and live-streaming Windows mixer
- `/download/` — official SC220 Live Windows download, release integrity, installation
- `/sc220-mkii-audio-interface/` — Recording Tech SC220 MKII hardware guide
- `/sc220-mkii-audio-interface/setup/` — SC220 MKII Windows / OBS setup
- `/sc220-mkii-audio-interface/support/` — SC220 MKII driver, Windows support, diagnostics
- `/ktv-k500-karaoke-processor/` — Recording Tech KTV Pro K500 karaoke processor guide
- `/en/...` — English equivalents

GitHub Pages remains a mirror. Build-time canonical, hreflang, sitemap and structured-data URLs always consolidate on the Cloudflare origin.

The production deployment smoke test validates the download-intent pages, driver/support intent, canonical URLs, structured data, sitemap entries and dual-origin JavaScript routing after each deploy.
