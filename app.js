(() => {
  "use strict";

  const fallback = {
    version: "0.1.2",
    published: "2026-08-14",
    download: "https://github.com/masarray/sc220-download/releases/download/v0.1.2/SC220-Live-v0.1.2-Setup-win-x64.exe",
    sha256: "ba6c61617d8c796dd953234e50f6d2e179c5efbe5e281892da7e7ba977e55693"
  };

  const html = document.documentElement;
  const isEnglish = html.lang.toLowerCase().startsWith("en");
  const locale = isEnglish ? "en-US" : "id-ID";
  const releaseSource = html.dataset.releaseSource || "latest.json";
  const normalizedPath = window.location.pathname.replace(/\/+$/, "/") || "/";
  const isGitHubPagesMirror = normalizedPath.startsWith("/sc220-download/");
  const siteBase = isGitHubPagesMirror ? "/sc220-download/" : "/";
  const isLandingPage = /^(?:\/|\/en\/|\/sc220-download\/|\/sc220-download\/en\/)$/.test(normalizedPath);

  const copyLabels = isEnglish
    ? { idle: "Copy", done: "Copied", templateDone: "Template copied" }
    : { idle: "Salin", done: "Tersalin", templateDone: "Template tersalin" };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const setReleaseData = (release) => {
    const version = String(release.version || fallback.version).replace(/^v/i, "");
    const versionLabel = `v${version}`;
    const publishedIso = release.published || fallback.published;
    const published = formatDate(publishedIso);
    const download = release.download || fallback.download;
    const sha256 = release.sha256 || fallback.sha256;
    const releaseUrl = `https://github.com/masarray/sc220-download/releases/tag/${encodeURIComponent(versionLabel)}`;

    document.querySelectorAll("[data-version]").forEach((node) => {
      node.textContent = versionLabel;
    });
    document.querySelectorAll("[data-published]").forEach((node) => {
      node.textContent = published;
    });
    document.querySelectorAll("[data-download-link]").forEach((node) => {
      node.href = download;
    });
    document.querySelectorAll("[data-release-link]").forEach((node) => {
      node.href = releaseUrl;
    });
    document.querySelectorAll("[data-sha]").forEach((node) => {
      node.textContent = sha256;
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
      try {
        const data = JSON.parse(node.textContent || "{}");
        const graph = Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
        graph.forEach((entry) => {
          if (entry?.["@type"] === "SoftwareApplication") {
            entry.softwareVersion = version;
            entry.datePublished = publishedIso;
            entry.downloadUrl = download;
          }
        });
        node.textContent = JSON.stringify(data);
      } catch {
        // Preserve static metadata if a page contains non-JSON structured data.
      }
    });
  };

  fetch(releaseSource, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(setReleaseData)
    .catch(() => setReleaseData(fallback));

  const header = document.querySelector("[data-header]");
  const updateHeader = () => {
    header?.classList.toggle("scrolled", window.scrollY > 12);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const copyButton = document.querySelector("[data-copy-sha]");
  const toast = document.querySelector("[data-toast]");
  let toastTimer;

  copyButton?.addEventListener("click", async () => {
    const value = document.querySelector("[data-sha]")?.textContent?.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      const label = copyButton.querySelector("span");
      if (label) label.textContent = copyLabels.done;
      toast?.classList.add("show");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast?.classList.remove("show");
        if (label) label.textContent = copyLabels.idle;
      }, 1800);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      const shaNode = document.querySelector("[data-sha]");
      if (!selection || !shaNode) return;
      range.selectNodeContents(shaNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  const ensureStylesheet = (href) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return existing;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = href;
    document.head.appendChild(stylesheet);
    return stylesheet;
  };

  const installP1GuidePromo = () => {
    const isIdGuide = /^(?:\/sc220-mkii-audio-interface\/|\/sc220-download\/sc220-mkii-audio-interface\/)$/.test(normalizedPath);
    const isEnGuide = /^(?:\/en\/sc220-mkii-audio-interface\/|\/sc220-download\/en\/sc220-mkii-audio-interface\/)$/.test(normalizedPath);
    if ((!isIdGuide && !isEnGuide) || document.querySelector(".p1-guide-promo")) return;

    const stylesheetHref = isEnGuide ? "../../sc220-mkii-p1.css" : "../sc220-mkii-p1.css";
    ensureStylesheet(stylesheetHref);

    const guideNav = document.querySelector(".guide-nav");
    if (guideNav && !guideNav.querySelector("[data-p1-setup]")) {
      const setupLink = document.createElement("a");
      setupLink.href = "setup/";
      setupLink.dataset.p1Setup = "";
      setupLink.textContent = isEnGuide ? "Setup by goal" : "Setup berdasarkan tujuan";
      const supportLink = document.createElement("a");
      supportLink.href = "support/";
      supportLink.dataset.p1Support = "";
      supportLink.textContent = "Driver & support";
      guideNav.append(setupLink, supportLink);
    }

    const promo = document.createElement("section");
    promo.className = "p1-guide-promo";
    promo.innerHTML = isEnGuide
      ? `<div class="p1-shell"><div><h2>Continue with a goal-based setup or driver and diagnostic checklist.</h2><p>Separate hardware gain, Windows device detection, monitoring, software mixing, and broadcast output before troubleshooting.</p></div><div class="p1-guide-links"><a href="setup/">Open setup guide</a><a href="support/">Open driver & support</a></div></div>`
      : `<div class="p1-shell"><div><h2>Lanjutkan ke setup berdasarkan tujuan atau panduan driver dan diagnosis.</h2><p>Pisahkan gain hardware, deteksi perangkat Windows, monitoring, mix software, dan output siaran sebelum troubleshooting.</p></div><div class="p1-guide-links"><a href="setup/">Buka cara setting</a><a href="support/">Buka driver & support</a></div></div>`;

    const sourceSection = document.querySelector("#sumber");
    const footer = document.querySelector("footer");
    const target = sourceSection || footer;
    if (target?.parentNode) target.parentNode.insertBefore(promo, target);
  };

  const supportCopyButton = document.querySelector("[data-copy-support-template]");
  supportCopyButton?.addEventListener("click", async () => {
    const template = document.querySelector("[data-support-template]")?.textContent?.trim();
    const status = document.querySelector("[data-copy-support-status]");
    if (!template) return;
    try {
      await navigator.clipboard.writeText(template);
      if (status) status.textContent = copyLabels.templateDone;
      window.setTimeout(() => {
        if (status) status.textContent = "";
      }, 2200);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      const node = document.querySelector("[data-support-template]");
      if (!selection || !node) return;
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      if (status) status.textContent = isEnglish ? "Select and copy the highlighted text" : "Pilih lalu salin teks yang disorot";
    }
  });

  const checkIcon = `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`;

  const landingCopy = isEnglish ? {
    kicker: "SC220 LIVE • FREE TO TRY",
    title: `Cleaner karaoke and live audio.<br><em>Easy to try. Easy to understand.</em>`,
    lead: "Bring your Recording Tech SC220 and PC audio into one clear Windows console. Balance levels, shape the sound, watch the meters, then send the final mix to OBS or TikTok Live Studio.",
    primary: "Try free on Windows",
    secondary: "See how it works",
    trust: ["365 days full control", "No credit card", "Official GitHub release + SHA-256", "Windows 10/11 x64"],
    safetyNote: "Windows SmartScreen may appear for newer apps. See how to verify the installer →",
    confidence: [
      ["FREE TO TRY", "365 days full control", "No card and no automatic charge."],
      ["CLEAR WORKFLOW", "One console, one final mix", "SC220 + PC audio + broadcast output."],
      ["VERIFY THE FILE", "SHA-256 is published", "Compare the installer hash before you run it."],
      ["OFFICIAL SOURCE", "Release hosted on GitHub", "Use the official download link on this page."]
    ],
    flowTitle: "One clear path from input to going live.",
    flowLead: "You do not need to memorize audio terminology. Follow the same order every time: choose the sources, shape the sound, check the level, then route the output.",
    flow: [
      ["01", "CHOOSE SOURCES", "SC220 + PC audio", "Pick the SC220 input and the Windows playback source you want to mix."],
      ["02", "SHAPE THE SOUND", "Balance and enhance", "Set the two levels, then use ASK-P Signature and ducking only when you need them."],
      ["03", "CHECK BEFORE LIVE", "Watch the level", "Use the meters to see whether the final programme is healthy before it reaches the stream."],
      ["04", "SEND TO BROADCAST", "OBS / TikTok Live", "Choose the stream output, then select the matching endpoint inside your broadcast app."]
    ],
    featureTitle: "Choose what you want to understand. The image follows.",
    featureLead: "Instead of showing many disconnected screenshots, this tour keeps one visual and one explanation together. Start with the benefit that matters to you.",
    features: [
      { key: "mix", tag: "CLEAR MIX", tab: "Know which source you are changing", title: "Control SC220 and PC audio without guessing.", body: "Both sources stay separate with their own fader, mute, meter, and a clearly defined final output.", points: ["See the source before changing it", "Balance voice and music independently", "One final mix goes to the broadcast app"], label: "SC220 + PC AUDIO" },
      { key: "sound", tag: "SOUND SHAPING", tab: "Shape the sound with five main controls", title: "Adjust the sound without opening a maze of parameters.", body: "ASK-P Signature keeps the creative controls focused: Enhance, Smart Bass, Smart Treble, Vocal Body, and Stereo Magic.", points: ["Few controls with clear jobs", "Easy to return to a sensible starting point", "Made for fast karaoke and live adjustments"], label: "ASK-P SIGNATURE" },
      { key: "duck", tag: "VOICE CLARITY", tab: "Keep voice clear over music", title: "Let the music make room when you start talking.", body: "Automatic ducking lowers PC audio smoothly when SC220 voice input is detected, then brings it back after you stop.", points: ["Useful for hosts and live talk", "Less manual fader riding", "Ducking remains visible and controllable"], label: "AUTOMATIC DUCKING" },
      { key: "meter", tag: "LEVEL CONFIDENCE", tab: "See the level before it clips", title: "Check the programme level before it reaches the audience.", body: "Loudness and peak meters give you a quick visual reference so you can correct an overly hot mix before going live.", points: ["Stereo peak visibility", "Programme-level feedback", "Check first, then go live"], label: "LOUDNESS + PEAK" },
      { key: "routing", tag: "CLEAR ROUTING", tab: "Recognize Windows device names", title: "Route audio without mysterious device labels.", body: "SC220 Live shows Windows endpoint names directly, making it easier to match the source and output with OBS or TikTok Live Studio.", points: ["Real Windows endpoint names", "Easier source/output matching", "Less trial and error during setup"], label: "WINDOWS ENDPOINTS" }
    ],
    trustKicker: "TRY WITH CONFIDENCE",
    trustTitle: "Verify first. Then install with confidence.",
    trustLead: "A SmartScreen warning can appear when an app or publisher has not yet built broad reputation in Windows. The warning alone does not prove that a file is malicious or safe. Download from the official source and verify the SHA-256 hash before continuing.",
    trustFacts: [
      ["01", "Free for 365 days", "Full control does not require a credit card."],
      ["02", "Official GitHub release", "The download button points to this project's release asset."],
      ["03", "SHA-256 published", "The checksum is visible on the page and can be copied."],
      ["04", "No automatic billing", "There is no automatic charge when the full-control period ends."]
    ],
    smartSummary: "What should I do if SmartScreen appears?",
    smartBody: "Do not ignore a warning blindly. Make sure you came from the official SC220 Live page, confirm the version and SHA-256 shown here match the installer you downloaded, and only continue when you are comfortable with the source. SmartScreen reputation can take time to build for newer software.",
    downloadNow: "Download official installer",
    releaseNotes: "View release notes",
    setupTitle: "Four steps. No need to memorize audio jargon.",
    setupLead: "Start with the official installer, verify the file if you want extra confidence, then follow the signal from source to broadcast output.",
    setup: [
      ["Download and install", "Use the official installer on this page. If SmartScreen appears, verify the source and checksum before continuing."],
      ["Choose the two sources", "Select Recording Tech SC220 and the Windows playback device that carries your music or PC audio."],
      ["Choose Stream Output", "Use CABLE Input as the final mix destination when VB-CABLE is part of your setup."],
      ["Connect the broadcast app", "In OBS or TikTok Live Studio, select CABLE Output or the matching endpoint for the final mix."]
    ],
    licenceTitle: "Try full control for 365 days. No card needed.",
    licenceBody: "Explore the full workflow without entering payment details and without an automatic charge at the end of the full-control period.",
    downloadTitle: "Ready to try it? Start with the official installer.",
    downloadLead: "Download the current Windows x64 release. Version, publication date, and SHA-256 are shown next to the button so you can verify what you received.",
    downloadReassurance: ["365 days full control", "No credit card", "SHA-256 available"],
    faqFreeQ: "Is SC220 Live really free to try?",
    faqFreeA: "Yes. Full control is available for 365 days without a credit card or automatic billing. After that period, core audio functions remain available while selected creative controls become read-only.",
    faqSmartQ: "Why can Windows SmartScreen appear?",
    faqSmartA: "SmartScreen uses reputation signals for apps and publishers. Newer or less widely downloaded software can therefore show a warning. Use the official download source and compare the published SHA-256 before deciding whether to run the installer."
  } : {
    kicker: "SC220 LIVE • GRATIS DICOBA",
    title: `Audio karaoke & live lebih rapi.<br><em>Mudah dicoba. Mudah dipahami.</em>`,
    lead: "Satukan Recording Tech SC220 dan audio PC dalam satu console Windows yang jelas. Atur level, bentuk karakter suara, cek meter, lalu kirim mix akhir ke OBS atau TikTok Live Studio.",
    primary: "Coba gratis di Windows",
    secondary: "Lihat cara kerjanya",
    trust: ["Full control 365 hari", "Tanpa kartu kredit", "Rilis resmi GitHub + SHA-256", "Windows 10/11 x64"],
    safetyNote: "Windows SmartScreen bisa muncul pada aplikasi baru. Lihat cara memverifikasi installer →",
    confidence: [
      ["GRATIS DICOBA", "Full control 365 hari", "Tanpa kartu dan tanpa tagihan otomatis."],
      ["ALUR YANG JELAS", "Satu console, satu mix akhir", "SC220 + audio PC + output siaran."],
      ["BISA DIVERIFIKASI", "SHA-256 dipublikasikan", "Cocokkan hash installer sebelum dijalankan."],
      ["SUMBER RESMI", "Rilis disimpan di GitHub", "Gunakan tombol download resmi di halaman ini."]
    ],
    flowTitle: "Satu alur jelas dari suara masuk sampai siap live.",
    flowLead: "Tidak perlu menghafal istilah audio. Ikuti urutan yang sama setiap kali: pilih sumber, rapikan suara, cek level, lalu arahkan output ke aplikasi live.",
    flow: [
      ["01", "PILIH SUMBER", "SC220 + audio PC", "Pilih input SC220 dan sumber playback Windows yang ingin Anda campur."],
      ["02", "RAPIKAN SUARA", "Atur level dan karakter", "Seimbangkan dua sumber, lalu gunakan ASK-P Signature dan ducking hanya saat dibutuhkan."],
      ["03", "CEK SEBELUM LIVE", "Pantau level", "Lihat meter untuk memastikan mix akhir tidak terlalu panas sebelum masuk ke siaran."],
      ["04", "KIRIM KE LIVE", "OBS / TikTok Live", "Pilih stream output, lalu pilih endpoint yang sama di aplikasi broadcast Anda."]
    ],
    featureTitle: "Pilih yang ingin Anda pahami. Gambarnya ikut berubah.",
    featureLead: "Bukan lagi kumpulan screenshot yang terpisah-pisah. Satu visual selalu ditemani satu penjelasan, supaya Anda tahu persis bagian mana yang sedang dibahas.",
    features: [
      { key: "mix", tag: "MIX YANG JELAS", tab: "Tahu sumber mana yang sedang diatur", title: "Atur SC220 dan audio PC tanpa menebak-nebak.", body: "Kedua sumber tetap terpisah dengan fader, mute, meter, dan output akhir yang jelas.", points: ["Lihat sumber sebelum mengubahnya", "Seimbangkan vokal dan musik terpisah", "Satu mix akhir menuju aplikasi live"], label: "SC220 + PC AUDIO" },
      { key: "sound", tag: "BENTUK SUARA", tab: "Bentuk suara dengan 5 kontrol utama", title: "Atur karakter suara tanpa membuka puluhan parameter.", body: "ASK-P Signature memusatkan kontrol kreatif pada Enhance, Smart Bass, Smart Treble, Vocal Body, dan Stereo Magic.", points: ["Sedikit kontrol dengan fungsi jelas", "Mudah kembali ke titik awal yang masuk akal", "Cepat untuk penyesuaian karaoke dan live"], label: "ASK-P SIGNATURE" },
      { key: "duck", tag: "VOKAL LEBIH JELAS", tab: "Beri ruang untuk vokal saat musik berjalan", title: "Biarkan musik turun halus ketika Anda mulai bicara.", body: "Automatic ducking menurunkan audio PC saat suara dari SC220 terdeteksi, lalu mengembalikannya setelah Anda berhenti bicara.", points: ["Berguna untuk host dan live talk", "Lebih sedikit naik-turun fader manual", "Ducking tetap terlihat dan bisa dikontrol"], label: "AUTOMATIC DUCKING" },
      { key: "meter", tag: "LEVEL LEBIH TERKONTROL", tab: "Lihat level sebelum suara terlalu keras", title: "Cek level program sebelum sampai ke penonton.", body: "Loudness dan peak meter memberi referensi visual cepat agar mix yang terlalu keras bisa dikoreksi sebelum live.", points: ["Peak stereo terlihat", "Level program mudah dipantau", "Cek dulu, baru GO LIVE"], label: "LOUDNESS + PEAK" },
      { key: "routing", tag: "ROUTING YANG JELAS", tab: "Kenali nama device Windows", title: "Routing audio tanpa nama device yang misterius.", body: "SC220 Live menampilkan nama endpoint Windows secara langsung agar sumber dan output lebih mudah dicocokkan dengan OBS atau TikTok Live Studio.", points: ["Nama endpoint Windows apa adanya", "Lebih mudah mencocokkan input/output", "Lebih sedikit trial-and-error saat setup"], label: "WINDOWS ENDPOINTS" }
    ],
    trustKicker: "LEBIH TENANG SAAT MENCOBA",
    trustTitle: "Verifikasi dulu. Baru install dengan percaya diri.",
    trustLead: "SmartScreen dapat menampilkan peringatan ketika aplikasi atau publisher belum memiliki reputasi luas di Windows. Peringatan itu sendiri bukan bukti bahwa file berbahaya atau aman. Gunakan sumber resmi dan cocokkan SHA-256 sebelum melanjutkan.",
    trustFacts: [
      ["01", "Gratis 365 hari", "Full control tidak meminta kartu kredit."],
      ["02", "Rilis resmi GitHub", "Tombol download mengarah ke aset release proyek ini."],
      ["03", "SHA-256 tersedia", "Checksum terlihat di halaman dan bisa disalin."],
      ["04", "Tanpa tagihan otomatis", "Tidak ada charge otomatis saat masa full control berakhir."]
    ],
    smartSummary: "Apa yang harus dilakukan jika SmartScreen muncul?",
    smartBody: "Jangan mengabaikan warning begitu saja. Pastikan Anda berasal dari halaman resmi SC220 Live, periksa versi dan SHA-256 yang ditampilkan di sini, lalu lanjutkan hanya jika Anda yakin dengan sumber file tersebut. Reputasi SmartScreen memang dapat membutuhkan waktu untuk software yang masih baru.",
    downloadNow: "Download installer resmi",
    releaseNotes: "Lihat catatan rilis",
    setupTitle: "Empat langkah. Tidak perlu hafal istilah audio.",
    setupLead: "Mulai dari installer resmi, verifikasi file bila ingin kepastian tambahan, lalu ikuti alur sinyal dari sumber sampai output live.",
    setup: [
      ["Download dan install", "Gunakan installer resmi dari halaman ini. Jika SmartScreen muncul, verifikasi sumber dan checksum sebelum melanjutkan."],
      ["Pilih dua sumber", "Pilih Recording Tech SC220 dan playback Windows yang membawa musik atau audio PC Anda."],
      ["Pilih Stream Output", "Gunakan CABLE Input sebagai tujuan mix akhir bila setup Anda menggunakan VB-CABLE."],
      ["Hubungkan aplikasi live", "Di OBS atau TikTok Live Studio, pilih CABLE Output atau endpoint yang sesuai untuk mix akhir."]
    ],
    licenceTitle: "Coba full control 365 hari. Tanpa kartu kredit.",
    licenceBody: "Pelajari seluruh workflow tanpa memasukkan data pembayaran dan tanpa tagihan otomatis ketika masa full control selesai.",
    downloadTitle: "Siap mencoba? Mulai dari installer resmi.",
    downloadLead: "Unduh rilis Windows x64 terbaru. Versi, tanggal publikasi, dan SHA-256 ditampilkan di samping tombol agar file yang diterima bisa diverifikasi.",
    downloadReassurance: ["Full control 365 hari", "Tanpa kartu kredit", "SHA-256 tersedia"],
    faqFreeQ: "Apakah SC220 Live benar-benar gratis dicoba?",
    faqFreeA: "Ya. Full control tersedia selama 365 hari tanpa kartu kredit dan tanpa tagihan otomatis. Setelah periode itu, fungsi audio utama tetap tersedia sementara kontrol kreatif tertentu menjadi read-only.",
    faqSmartQ: "Kenapa Windows SmartScreen bisa muncul?",
    faqSmartA: "SmartScreen menggunakan sinyal reputasi aplikasi dan publisher. Software yang lebih baru atau belum banyak diunduh dapat menampilkan warning. Gunakan sumber download resmi dan cocokkan SHA-256 yang dipublikasikan sebelum memutuskan menjalankan installer."
  };

  const enhanceLandingExperience = () => {
    if (!isLandingPage) return;

    document.body.classList.add("landing-v3");
    ensureStylesheet(`${siteBase}landing-v3.css?v=20260815-1`);

    const nav = document.querySelector(".desktop-nav");
    if (nav) {
      nav.innerHTML = isEnglish
        ? `<a href="#how-it-works">How it works</a><a href="#features">Why it helps</a><a href="#safe-to-try">Safety & trust</a><a href="#setup">Setup</a><a href="#download">Download</a>`
        : `<a href="#cara-kerja">Cara kerja</a><a href="#fitur">Manfaat</a><a href="#aman-dicoba">Aman & terpercaya</a><a href="#instalasi">Instalasi</a><a href="#download">Unduh</a>`;
    }

    const hero = document.querySelector(".hero");
    const heroCopy = hero?.querySelector(".hero-copy");
    if (heroCopy) {
      const kicker = heroCopy.querySelector(".kicker");
      const title = heroCopy.querySelector("h1");
      const lead = heroCopy.querySelector(".hero-lead");
      const primary = heroCopy.querySelector(".button-primary span");
      const secondary = heroCopy.querySelector(".button-secondary");
      const trust = heroCopy.querySelector(".hero-trust");

      if (kicker) kicker.innerHTML = `<span></span> ${landingCopy.kicker}`;
      if (title) title.innerHTML = landingCopy.title;
      if (lead) lead.textContent = landingCopy.lead;
      if (primary) primary.textContent = landingCopy.primary;
      if (secondary) {
        secondary.href = isEnglish ? "#how-it-works" : "#cara-kerja";
        secondary.innerHTML = `${landingCopy.secondary} <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>`;
      }
      if (trust) trust.innerHTML = landingCopy.trust.map((item) => `<span>${checkIcon}${item}</span>`).join("");
      if (!heroCopy.querySelector(".hero-safety-note")) {
        const safety = document.createElement("a");
        safety.className = "hero-safety-note";
        safety.href = isEnglish ? "#safe-to-try" : "#aman-dicoba";
        safety.textContent = landingCopy.safetyNote;
        trust?.insertAdjacentElement("afterend", safety);
      }
    }

    if (hero && !document.querySelector(".confidence-strip")) {
      const strip = document.createElement("section");
      strip.className = "confidence-strip";
      strip.setAttribute("aria-label", isEnglish ? "Why SC220 Live is easy to try" : "Alasan SC220 Live mudah dicoba");
      strip.innerHTML = `<div class="confidence-shell">${landingCopy.confidence.map((item) => `<article class="confidence-item"><small>${item[0]}</small><strong>${item[1]}</strong><span>${item[2]}</span></article>`).join("")}</div>`;
      hero.insertAdjacentElement("afterend", strip);
    }

    const flowSection = document.querySelector(isEnglish ? "#how-it-works" : "#cara-kerja");
    if (flowSection) {
      const h2 = flowSection.querySelector(".section-heading h2");
      const lead = flowSection.querySelector(".section-heading > p");
      const flow = flowSection.querySelector(".signal-flow");
      if (h2) h2.textContent = landingCopy.flowTitle;
      if (lead) lead.textContent = landingCopy.flowLead;
      flow?.classList.add("beginner-flow");
      const articles = flow?.querySelectorAll("article") || [];
      articles.forEach((article, index) => {
        const item = landingCopy.flow[index];
        if (!item) return;
        const number = article.querySelector(".flow-number");
        const small = article.querySelector("small");
        const heading = article.querySelector("h3");
        const p = article.querySelector("p");
        if (number) number.textContent = item[0];
        if (small) small.textContent = item[1];
        if (heading) heading.textContent = item[2];
        if (p) p.textContent = item[3];
      });
    }

    const featuresSection = document.querySelector(isEnglish ? "#features" : "#fitur");
    if (featuresSection) {
      const h2 = featuresSection.querySelector(".section-heading h2");
      const lead = featuresSection.querySelector(".section-heading > p");
      const grid = featuresSection.querySelector(".feature-grid");
      if (h2) h2.textContent = landingCopy.featureTitle;
      if (lead) lead.textContent = landingCopy.featureLead;

      if (grid) {
        const shotSrc = isEnglish ? "../assets/screenshot/Screenshot.webp" : "assets/screenshot/Screenshot.webp";
        grid.innerHTML = `<div class="feature-tour-layout"><div class="feature-tour-nav" role="tablist" aria-label="${isEnglish ? "SC220 Live feature tour" : "Tur fitur SC220 Live"}">${landingCopy.features.map((feature, index) => `<button class="feature-tab" type="button" role="tab" aria-selected="${index === 0 ? "true" : "false"}" tabindex="${index === 0 ? "0" : "-1"}" data-feature-key="${feature.key}"><span class="feature-tab-index">0${index + 1}</span><span><small>${feature.tag}</small><strong>${feature.tab}</strong></span></button>`).join("")}</div><article class="feature-tour-stage"><div class="tour-shot" data-mode="mix"><img src="${shotSrc}" decoding="async" alt="${isEnglish ? "SC220 Live interface detail" : "Detail antarmuka SC220 Live"}"><span class="tour-visual-label" data-tour-label>${landingCopy.features[0].label}</span></div><div class="tour-copy"><div><span class="feature-tag" data-tour-tag>${landingCopy.features[0].tag}</span><h3 data-tour-title>${landingCopy.features[0].title}</h3><p data-tour-body>${landingCopy.features[0].body}</p></div><ul class="tour-points" data-tour-points>${landingCopy.features[0].points.map((point) => `<li>${point}</li>`).join("")}</ul></div></article></div>`;

        const tabs = Array.from(grid.querySelectorAll(".feature-tab"));
        const shot = grid.querySelector(".tour-shot");
        const label = grid.querySelector("[data-tour-label]");
        const tag = grid.querySelector("[data-tour-tag]");
        const title = grid.querySelector("[data-tour-title]");
        const body = grid.querySelector("[data-tour-body]");
        const points = grid.querySelector("[data-tour-points]");

        const activateFeature = (key, focus = false) => {
          const feature = landingCopy.features.find((item) => item.key === key) || landingCopy.features[0];
          tabs.forEach((tab) => {
            const active = tab.dataset.featureKey === feature.key;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active && focus) tab.focus({ preventScroll: true });
          });
          if (shot) shot.dataset.mode = feature.key;
          if (label) label.textContent = feature.label;
          if (tag) tag.textContent = feature.tag;
          if (title) title.textContent = feature.title;
          if (body) body.textContent = feature.body;
          if (points) points.innerHTML = feature.points.map((point) => `<li>${point}</li>`).join("");
        };

        tabs.forEach((tab, index) => {
          tab.addEventListener("click", () => activateFeature(tab.dataset.featureKey));
          tab.addEventListener("keydown", (event) => {
            if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            let nextIndex = index;
            if (["ArrowDown", "ArrowRight"].includes(event.key)) nextIndex = (index + 1) % tabs.length;
            if (["ArrowUp", "ArrowLeft"].includes(event.key)) nextIndex = (index - 1 + tabs.length) % tabs.length;
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = tabs.length - 1;
            activateFeature(tabs[nextIndex].dataset.featureKey, true);
          });
        });
      }
    }

    if (featuresSection && !document.querySelector(".trust-section")) {
      const trustSection = document.createElement("section");
      trustSection.className = "trust-section";
      trustSection.id = isEnglish ? "safe-to-try" : "aman-dicoba";
      trustSection.innerHTML = `<div class="trust-shell"><div class="trust-copy"><p class="kicker dark"><span></span> ${landingCopy.trustKicker}</p><h2>${landingCopy.trustTitle}</h2><p>${landingCopy.trustLead}</p><div class="trust-actions"><a class="button button-primary" data-download-link href="${fallback.download}"><span>${landingCopy.downloadNow}</span></a><a class="button button-secondary" data-release-link href="https://github.com/masarray/sc220-download/releases">${landingCopy.releaseNotes}</a></div></div><div class="trust-panel"><div class="trust-facts">${landingCopy.trustFacts.map((fact) => `<article class="trust-fact"><span>${fact[0]}</span><strong>${fact[1]}</strong><p>${fact[2]}</p></article>`).join("")}</div><details class="smartscreen-box"><summary>${landingCopy.smartSummary}</summary><p>${landingCopy.smartBody}</p></details></div></div>`;
      featuresSection.insertAdjacentElement("afterend", trustSection);
    }

    const setupSection = document.querySelector(isEnglish ? "#setup" : "#instalasi");
    if (setupSection) {
      const h2 = setupSection.querySelector(".setup-copy h2");
      const lead = setupSection.querySelector(".setup-copy > p:not(.kicker)");
      if (h2) h2.textContent = landingCopy.setupTitle;
      if (lead) lead.textContent = landingCopy.setupLead;
      setupSection.querySelectorAll(".setup-steps li").forEach((li, index) => {
        const item = landingCopy.setup[index];
        if (!item) return;
        const heading = li.querySelector("h3");
        const p = li.querySelector("p");
        if (heading) heading.textContent = item[0];
        if (p) p.textContent = item[1];
      });
    }

    const licence = document.querySelector(".licence-section");
    if (licence) {
      const h2 = licence.querySelector(".licence-main h2");
      const p = licence.querySelector(".licence-main > p:not(.kicker)");
      if (h2) h2.textContent = landingCopy.licenceTitle;
      if (p) p.textContent = landingCopy.licenceBody;
    }

    const downloadSection = document.querySelector("#download");
    if (downloadSection) {
      const h2 = downloadSection.querySelector(".download-copy h2");
      const p = downloadSection.querySelector(".download-copy > p:not(.kicker)");
      if (h2) h2.textContent = landingCopy.downloadTitle;
      if (p) p.textContent = landingCopy.downloadLead;
      const actions = downloadSection.querySelector(".download-actions");
      if (actions && !downloadSection.querySelector(".download-reassurance")) {
        actions.insertAdjacentHTML("afterend", `<div class="download-reassurance">${landingCopy.downloadReassurance.map((item) => `<span>${item}</span>`).join("")}</div>`);
      }
    }

    const faq = document.querySelector(".faq");
    if (faq && !faq.querySelector("[data-confidence-faq]")) {
      const firstDetails = faq.querySelector("details");
      const freeDetails = document.createElement("details");
      freeDetails.dataset.confidenceFaq = "";
      freeDetails.innerHTML = `<summary>${landingCopy.faqFreeQ}</summary><p>${landingCopy.faqFreeA}</p>`;
      const smartDetails = document.createElement("details");
      smartDetails.dataset.confidenceFaq = "";
      smartDetails.innerHTML = `<summary>${landingCopy.faqSmartQ}</summary><p>${landingCopy.faqSmartA}</p>`;
      if (firstDetails) {
        faq.insertBefore(smartDetails, firstDetails);
        faq.insertBefore(freeDetails, smartDetails);
      } else {
        faq.append(freeDetails, smartDetails);
      }
    }

    const topicSection = document.querySelector(".topic-section");
    const faqSection = document.querySelector(".requirements-faq");
    if (topicSection && faqSection?.parentNode) {
      topicSection.classList.add("landing-resource-compact");
      faqSection.insertAdjacentElement("afterend", topicSection);
    }

    const revealSelectors = [
      ".confidence-strip",
      isEnglish ? "#how-it-works" : "#cara-kerja",
      isEnglish ? "#features" : "#fitur",
      ".trust-section",
      isEnglish ? "#setup" : "#instalasi",
      ".licence-section",
      "#download",
      ".requirements-faq",
      ".topic-section"
    ];
    const revealNodes = revealSelectors.map((selector) => document.querySelector(selector)).filter(Boolean);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion && "IntersectionObserver" in window) {
      revealNodes.forEach((node) => node.classList.add("reveal-item"));
      document.body.classList.add("motion-ready");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8%", threshold: .08 });
      revealNodes.forEach((node) => observer.observe(node));
    } else {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
    }

    const stage = document.querySelector(".product-stage");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (stage && finePointer && !reduceMotion) {
      let frame = 0;
      stage.addEventListener("pointermove", (event) => {
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = stage.getBoundingClientRect();
          const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
          stage.style.setProperty("--tilt-x", `${(.5 - y) * 2.2}deg`);
          stage.style.setProperty("--tilt-y", `${(x - .5) * 3.6}deg`);
          stage.style.setProperty("--glow-x", `${x * 100}%`);
          stage.style.setProperty("--glow-y", `${y * 100}%`);
        });
      }, { passive: true });
      stage.addEventListener("pointerleave", () => {
        stage.style.setProperty("--tilt-x", ".7deg");
        stage.style.setProperty("--tilt-y", "-1.8deg");
        stage.style.setProperty("--glow-x", "70%");
        stage.style.setProperty("--glow-y", "30%");
      });
    }
  };

  installP1GuidePromo();

  if (isLandingPage) {
    enhanceLandingExperience();
  } else {
    // Keep the broader site refinement for documentation/support pages. Landing pages
    // use the local Plus Jakarta stack and their dedicated lightweight visual layer.
    ensureStylesheet(`${siteBase}site-refinement.css?v=20260808-2`);
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
