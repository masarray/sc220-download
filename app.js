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
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
  };

  const setReleaseData = (release) => {
    const version = String(release.version || fallback.version).replace(/^v/i, "");
    const versionLabel = `v${version}`;
    const publishedIso = release.published || fallback.published;
    const published = formatDate(publishedIso);
    const download = release.download || fallback.download;
    const sha256 = release.sha256 || fallback.sha256;
    const releaseUrl = `https://github.com/masarray/sc220-download/releases/tag/${encodeURIComponent(versionLabel)}`;

    document.querySelectorAll("[data-version]").forEach((node) => { node.textContent = versionLabel; });
    document.querySelectorAll("[data-published]").forEach((node) => { node.textContent = published; });
    document.querySelectorAll("[data-download-link]").forEach((node) => { node.href = download; });
    document.querySelectorAll("[data-release-link]").forEach((node) => { node.href = releaseUrl; });
    document.querySelectorAll("[data-sha]").forEach((node) => { node.textContent = sha256; });

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
        // Keep source-controlled structured data if another page contains non-JSON content.
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
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const copyButton = document.querySelector("[data-copy-sha]");
  const toast = document.querySelector("[data-toast]");
  let toastTimer;
  copyButton?.addEventListener("click", async () => {
    const shaNode = document.querySelector("[data-sha]");
    const value = shaNode?.textContent?.trim();
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
      if (!selection || !shaNode) return;
      const range = document.createRange();
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
      window.setTimeout(() => { if (status) status.textContent = ""; }, 2200);
    } catch {
      const selection = window.getSelection();
      const node = document.querySelector("[data-support-template]");
      if (!selection || !node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      if (status) status.textContent = isEnglish ? "Select and copy the highlighted text" : "Pilih lalu salin teks yang disorot";
    }
  });

  const initFeatureTour = () => {
    const tabs = Array.from(document.querySelectorAll("[data-feature-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-feature-panel]"));
    if (!tabs.length || !panels.length) return;

    const activate = (id, focus = false) => {
      tabs.forEach((tab) => {
        const active = tab.getAttribute("aria-controls") === id;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus({ preventScroll: true });
      });
      panels.forEach((panel) => {
        const active = panel.id === id;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab.getAttribute("aria-controls")));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        activate(tabs[next].getAttribute("aria-controls"), true);
      });
    });
  };

  const initReveal = () => {
    const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    document.body.classList.add("motion-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "80px 0px -6%", threshold: .04 });

    nodes.forEach((node) => observer.observe(node));
  };

  const initProductTilt = () => {
    const stage = document.querySelector(".product-stage");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!stage || reduceMotion || !finePointer) return;
    let frame = 0;
    stage.addEventListener("pointermove", (event) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
        stage.style.setProperty("--tilt-x", `${(.5 - y) * 1.2}deg`);
        stage.style.setProperty("--tilt-y", `${(x - .5) * 2}deg`);
        stage.style.setProperty("--glow-x", `${x * 100}%`);
        stage.style.setProperty("--glow-y", `${y * 100}%`);
      });
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      stage.style.setProperty("--tilt-x", ".2deg");
      stage.style.setProperty("--tilt-y", "-.8deg");
      stage.style.setProperty("--glow-x", "70%");
      stage.style.setProperty("--glow-y", "30%");
    });
  };

  const polishLandingCopy = () => {
    if (!isLandingPage) return;

    const chevron = `<svg class="lucide details-chevron" aria-hidden="true"><use href="#icon-chevron-down"/></svg>`;
    const faq = document.querySelector(".faq");
    const requirements = document.querySelector(".requirements");
    const userQuestions = document.querySelector(".user-questions-section");
    const requirementsFaq = document.querySelector(".requirements-faq");

    const heroEyebrow = document.querySelector(".hero .eyebrow");
    if (heroEyebrow) heroEyebrow.textContent = isEnglish ? "SC220 LIVE • FREE TO USE" : "SC220 LIVE • GRATIS DIPAKAI";

    const heroLead = document.querySelector(".hero-lead");
    if (heroLead) heroLead.textContent = isEnglish
      ? "Use a Recording Tech SC220 or another audio interface? Both are welcome. SC220 Live brings your interface and PC audio into one clear Windows console, so you can balance levels, shape the sound, check the meters, and send the final mix to OBS or TikTok Live Studio without making the setup feel complicated."
      : "Pakai Recording Tech SC220 atau audio interface lain? Boleh. SC220 Live menyatukan suara dari interface dan audio PC dalam satu console Windows yang mudah dibaca. Atur level, rapikan karakter suara, cek meter, lalu kirim mix akhir ke OBS atau TikTok Live Studio tanpa membuat setup terasa rumit.";

    const heroTrust = Array.from(document.querySelectorAll(".hero-trust span"));
    if (heroTrust[0]) heroTrust[0].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "Free forever" : "Gratis dipakai selamanya"}`;
    if (heroTrust[1]) heroTrust[1].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "No login or subscription required" : "Tanpa login atau subscription wajib"}`;

    const heroNote = document.querySelector(".hero-note");
    if (heroNote) heroNote.innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-circle-help"/></svg>${isEnglish ? "New to audio routing? The common questions are answered below." : "Masih awam soal routing audio? Pertanyaan yang paling sering muncul sudah dijawab di bawah."}`;

    const confidence = document.querySelector(".confidence-item");
    if (confidence) {
      const small = confidence.querySelector("small");
      const strong = confidence.querySelector("strong");
      const text = confidence.querySelector("span");
      if (small) small.textContent = isEnglish ? "FREE FOREVER" : "GRATIS SELAMANYA";
      if (strong) strong.textContent = isEnglish ? "Download it. Use it. Keep it." : "Download. Pakai. Tetap gratis.";
      if (text) text.textContent = isEnglish ? "No required login, subscription, credit card, or payment. Full-control activation is optional." : "Tanpa login, subscription wajib, kartu kredit, atau kewajiban membayar. Aktivasi full control sifatnya pilihan.";
    }

    const flowHeading = document.querySelector("#cara-kerja .section-heading h2, #how-it-works .section-heading h2");
    const flowLead = document.querySelector("#cara-kerja .section-heading > p, #how-it-works .section-heading > p");
    if (flowHeading) flowHeading.textContent = isEnglish ? "Four simple steps from input to live." : "Empat langkah sederhana, dari suara masuk sampai siap live.";
    if (flowLead) flowLead.textContent = isEnglish ? "Start with the basics: choose the source, balance it, check the level, then send the final mix to your live app." : "Mulai dari yang paling gampang: pilih sumber suara, atur keseimbangannya, cek level, lalu kirim mix akhir ke aplikasi live.";

    const featureHeading = document.querySelector("#fitur .section-heading h2, #features .section-heading h2");
    const featureLead = document.querySelector("#fitur .section-heading > p, #features .section-heading > p");
    if (featureHeading) featureHeading.textContent = isEnglish ? "The controls you actually need, explained one at a time." : "Kontrol yang sering dipakai, dijelaskan satu per satu.";
    if (featureLead) featureLead.textContent = isEnglish ? "Choose a topic and the screenshot follows it. No guessing which caption belongs to which part of the app." : "Pilih topiknya, lalu gambar akan mengikuti. Jadi tidak perlu menebak caption mana yang sedang menjelaskan bagian tertentu.";

    const trustTitle = document.querySelector(".trust-copy h2");
    const trustBody = document.querySelector(".trust-copy > p:not(.eyebrow)");
    const smartSummary = document.querySelector(".smartscreen-box summary span");
    const smartBody = document.querySelector(".smartscreen-box p");
    if (trustTitle) trustTitle.textContent = isEnglish ? "SmartScreen appeared? That can be normal." : "SmartScreen muncul? Tenang, ini bisa terjadi.";
    if (trustBody) trustBody.innerHTML = isEnglish
      ? "Windows can show this message for software from a newer developer or an app that has not built up a large SmartScreen reputation yet. <strong>Download from this official page first.</strong> If you want to continue, choose <strong>More info → Run anyway</strong>. You do not need to turn off your antivirus."
      : "Windows kadang menampilkan peringatan ini pada software dari developer baru atau aplikasi yang reputasinya belum banyak terbentuk di SmartScreen. <strong>Pastikan installer berasal dari halaman resmi ini.</strong> Kalau ingin lanjut, pilih <strong>More info → Run anyway</strong>. Tidak perlu mematikan antivirus.";
    if (smartSummary) smartSummary.textContent = isEnglish ? "Want an extra check before installing?" : "Ingin cek file dulu sebelum install?";
    if (smartBody) smartBody.textContent = isEnglish
      ? "Compare the SHA-256 on this page with the file you downloaded. It is an optional integrity check for users who want extra assurance."
      : "Cocokkan SHA-256 yang tampil di halaman ini dengan file yang Anda download. Ini langkah tambahan bila Anda ingin memastikan file yang diterima sama dengan rilis resmi.";

    const setupTitle = document.querySelector(".setup-copy h2");
    const setupBody = document.querySelector(".setup-copy > p");
    if (setupTitle) setupTitle.textContent = isEnglish ? "Download, install, choose your audio, then start." : "Download, install, pilih audio, lalu mulai.";
    if (setupBody) setupBody.textContent = isEnglish ? "You do not need to understand every audio term on day one. Start with the simple path and refine it later." : "Tidak perlu memahami semua istilah audio sejak awal. Ikuti jalur sederhana dulu; setelah sudah bunyi, baru rapikan setting pelan-pelan.";

    const licence = document.querySelector(".licence-section");
    if (licence) {
      const eyebrow = licence.querySelector(".licence-main .eyebrow");
      const title = licence.querySelector(".licence-main h2");
      const body = licence.querySelector(".licence-main > p:not(.eyebrow)");
      const afterSmall = licence.querySelector(".licence-after small");
      const afterTitle = licence.querySelector(".licence-after h3");
      const afterBody = licence.querySelector(".licence-after p");
      if (eyebrow) eyebrow.textContent = isEnglish ? "FREE, WITHOUT THE CATCH" : "GRATIS, TANPA SYARAT RIBET";
      if (title) title.textContent = isEnglish ? "Download it and use it for free, forever." : "Download dan gunakan gratis selamanya.";
      if (body) body.textContent = isEnglish ? "No required paid subscription, account login, credit card, or payment just to keep the app working. Install it, use it with your own setup, and keep using the free version for as long as you like." : "Tidak ada subscription berbayar yang diwajibkan, tidak perlu login, tidak perlu kartu kredit, dan tidak ada kewajiban membayar agar aplikasinya tetap bisa dipakai. Download, install, lalu gunakan selama Anda membutuhkannya.";
      if (afterSmall) afterSmall.textContent = isEnglish ? "IF YOU LOVE IT" : "KALAU ANDA SUKA";
      if (afterTitle) afterTitle.textContent = isEnglish ? "Full control is there when you want it" : "Full control bisa diaktifkan kapan saja";
      if (afterBody) afterBody.innerHTML = isEnglish ? "If SC220 Live becomes part of your daily setup and you want every control unlocked, open <strong>License Activation</strong> inside the app. Activation is optional and kept affordable. <span class=\"license-signature\">An innovation from Mas Ari for the world.</span>" : "Kalau SC220 Live cocok dan Anda ingin semua kontrol terbuka, masuk ke menu <strong>License Activation</strong> di dalam aplikasi. Aktivasi ini tidak wajib, dan harganya dibuat tetap terjangkau. <span class=\"license-signature\">Inovasi dari Mas Ari untuk Dunia.</span>";
    }

    const downloadTitle = document.querySelector(".download-copy h2");
    const downloadBody = document.querySelector(".download-copy > p");
    if (downloadTitle) downloadTitle.textContent = isEnglish ? "Ready to try it? Start with the official installer." : "Siap mencoba? Mulai dari installer resminya.";
    if (downloadBody) downloadBody.textContent = isEnglish ? "The Windows x64 download below points to the official stable release. Version, publish date, and SHA-256 are shown beside it." : "Tombol di bawah mengarah ke rilis stabil resmi Windows x64. Nomor versi, tanggal rilis, dan SHA-256 tampil di sampingnya.";

    const reassurance = Array.from(document.querySelectorAll(".download-reassurance span"));
    if (reassurance[0]) reassurance[0].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "Free forever" : "Gratis dipakai selamanya"}`;
    if (reassurance[1]) reassurance[1].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "No required subscription" : "Tanpa subscription wajib"}`;

    if (faq) {
      faq.innerHTML = isEnglish
        ? `<p class="eyebrow dark" data-reveal>THE BASICS</p><h2 data-reveal style="--reveal-delay:60ms">A few things worth knowing before you download.</h2>
          <details data-reveal style="--reveal-delay:90ms"><summary><span>Is SC220 Live free?</span>${chevron}</summary><p><strong>Yes. You can keep using it for free.</strong> There is no required subscription, login, credit card, or payment just to keep the app working. If you enjoy it and want every control unlocked, full-control activation is available inside the app.</p></details>
          <details data-reveal style="--reveal-delay:120ms"><summary><span>Do I need a Recording Tech SC220?</span>${chevron}</summary><p><strong>No.</strong> The SC220 is the interface we test and document most often, but the app is not locked to that hardware. Other Windows audio interfaces can be tried as long as Windows sees the device correctly and the routing fits your setup.</p></details>
          <details data-reveal style="--reveal-delay:150ms"><summary><span>Is there a Mac version?</span>${chevron}</summary><p><strong>Yes.</strong> The macOS version is distributed separately. The main download button on this page is for Windows x64, so use the build that matches your operating system.</p></details>
          <details data-reveal style="--reveal-delay:180ms"><summary><span>How do I download and install it?</span>${chevron}</summary><p>Click <strong>Download SC220 Live</strong>, open the installer, follow the setup steps, then choose your audio interface and output. New to routing? Start simple first—you can refine the setup later.</p></details>
          <details data-reveal style="--reveal-delay:210ms"><summary><span>SmartScreen says Windows protected my PC. What should I do?</span>${chevron}</summary><p>This is common with software from newer developers. <strong>If the installer came from this official page, choose “More info”, then “Run anyway”.</strong> You do not need to disable your antivirus. SHA-256 is also available on this page if you want to verify the file first.</p></details>
          <details data-reveal style="--reveal-delay:240ms"><summary><span>Do I have to install VB-CABLE?</span>${chevron}</summary><p>Not for every setup. VB-CABLE is useful when you need to pass the final mix into another Windows app as a virtual audio device, for example OBS or TikTok Live Studio.</p></details>
          <details data-reveal style="--reveal-delay:270ms"><summary><span>Is SC220 Live a karaoke song player?</span>${chevron}</summary><p>No. It handles <strong>mixing, sound processing, metering, and routing</strong>. Songs and lyrics still come from your usual karaoke or playback app.</p></details>
          <details data-reveal style="--reveal-delay:300ms"><summary><span>Can I use it with OBS or TikTok Live Studio?</span>${chevron}</summary><p>Yes. Send the final mix to a suitable Windows audio endpoint, then choose that same endpoint as the audio input in OBS, TikTok Live Studio, or another compatible app.</p></details>`
        : `<p class="eyebrow dark" data-reveal>PERTANYAAN DASAR</p><h2 data-reveal style="--reveal-delay:60ms">Sebelum download, ini yang paling sering ingin diketahui.</h2>
          <details data-reveal style="--reveal-delay:90ms"><summary><span>SC220 Live gratis atau berbayar?</span>${chevron}</summary><p><strong>Gratis dan boleh dipakai selamanya.</strong> Tidak ada kewajiban subscription, login, kartu kredit, atau pembayaran agar aplikasinya tetap bisa dipakai. Kalau nanti Anda suka dan ingin semua kontrol terbuka, full-control activation tersedia di dalam aplikasi.</p></details>
          <details data-reveal style="--reveal-delay:120ms"><summary><span>Apakah harus punya Recording Tech SC220?</span>${chevron}</summary><p><strong>Tidak harus.</strong> SC220 memang perangkat yang paling sering diuji dan didokumentasikan, tetapi aplikasinya tidak dikunci hanya untuk SC220. Audio interface lain boleh dicoba selama terbaca dengan baik di Windows dan routing-nya cocok dengan setup Anda.</p></details>
          <details data-reveal style="--reveal-delay:150ms"><summary><span>Ada versi untuk Mac?</span>${chevron}</summary><p><strong>Ada.</strong> Versi macOS didistribusikan terpisah. Tombol download utama di halaman ini adalah untuk Windows x64, jadi gunakan build yang sesuai dengan sistem operasi Anda.</p></details>
          <details data-reveal style="--reveal-delay:180ms"><summary><span>Bagaimana cara download dan install?</span>${chevron}</summary><p>Klik <strong>Unduh SC220 Live</strong>, buka installer, ikuti langkah setup, lalu pilih audio interface dan output yang ingin dipakai. Masih awam soal routing? Mulai dari setup paling sederhana dulu—nanti bisa dirapikan pelan-pelan.</p></details>
          <details data-reveal style="--reveal-delay:210ms"><summary><span>SmartScreen bilang Windows melindungi PC. Harus bagaimana?</span>${chevron}</summary><p>Pesan ini cukup umum pada software dari developer baru. <strong>Kalau installer berasal dari halaman resmi ini, klik “More info”, lalu pilih “Run anyway”.</strong> Tidak perlu mematikan antivirus. Kalau ingin cek dulu, SHA-256 resmi juga tersedia di halaman ini.</p></details>
          <details data-reveal style="--reveal-delay:240ms"><summary><span>Apakah harus install VB-CABLE?</span>${chevron}</summary><p>Tidak selalu. VB-CABLE berguna kalau hasil mix dari SC220 Live perlu dikirim ke aplikasi Windows lain sebagai virtual audio device, misalnya OBS atau TikTok Live Studio.</p></details>
          <details data-reveal style="--reveal-delay:270ms"><summary><span>SC220 Live itu aplikasi pemutar karaoke?</span>${chevron}</summary><p>Bukan. SC220 Live menangani <strong>mixing, pengolahan suara, meter, dan routing audio</strong>. Lagu dan lirik tetap berasal dari aplikasi karaoke atau player yang biasa Anda gunakan.</p></details>
          <details data-reveal style="--reveal-delay:300ms"><summary><span>Bisa dipakai untuk OBS atau TikTok Live Studio?</span>${chevron}</summary><p>Bisa. Kirim mix akhir ke endpoint audio Windows yang sesuai, lalu pilih endpoint yang sama sebagai input audio di OBS, TikTok Live Studio, atau aplikasi kompatibel lainnya.</p></details>`;
    }

    if (requirements) {
      const heading = requirements.querySelector("h2");
      if (heading) heading.textContent = isEnglish ? "For the Windows installer on this page." : "Untuk installer Windows di halaman ini.";
    }

    if (userQuestions && requirementsFaq) {
      requirementsFaq.insertAdjacentElement("afterend", userQuestions);
      const eyebrow = userQuestions.querySelector(".questions-heading .eyebrow");
      const title = userQuestions.querySelector(".questions-heading h2");
      const lead = userQuestions.querySelector(".questions-heading > p");
      if (eyebrow) eyebrow.textContent = isEnglish ? "FROM USER COMMENTS" : "DARI KOMENTAR PENGGUNA";
      if (title) title.textContent = isEnglish ? "Real questions that come up once people start trying it." : "Pertanyaan nyata yang muncul saat orang mulai mencoba.";
      if (lead) lead.textContent = isEnglish ? "These came from the kinds of questions people ask when matching SC220 Live to their own hardware and apps." : "Bagian ini berisi hal-hal yang memang sering ditanyakan saat orang mulai mencocokkan SC220 Live dengan hardware dan aplikasi yang mereka pakai.";

      Array.from(userQuestions.querySelectorAll(".question-card")).forEach((card) => {
        const question = card.querySelector("summary strong")?.textContent || "";
        const duplicateBasic = isEnglish
          ? /only for the Recording Tech SC220|SmartScreen or antivirus/i.test(question)
          : /khusus untuk Recording Tech SC220|Windows bilang virus/i.test(question);
        if (duplicateBasic) card.remove();
      });

      const androidCard = Array.from(userQuestions.querySelectorAll(".question-card")).find((card) => /Android|HP/i.test(card.querySelector("summary strong")?.textContent || ""));
      const androidAnswer = androidCard?.querySelector(".question-answer");
      if (androidAnswer) androidAnswer.innerHTML = isEnglish
        ? `<strong>Not yet.</strong> SC220 Live is currently available for computers—Windows and macOS—not as an Android APK. If you find a random APK using the SC220 Live name, do not assume it is an official build.`
        : `<strong>Belum ada versi Android.</strong> SC220 Live saat ini tersedia untuk komputer—Windows dan macOS—bukan APK untuk ponsel. Kalau Anda menemukan APK acak yang memakai nama SC220 Live, jangan langsung menganggapnya sebagai rilis resmi.`;
    }
  };

  installP1GuidePromo();

  if (isLandingPage) {
    polishLandingCopy();
    initFeatureTour();
    initReveal();
    initProductTilt();
  } else {
    ensureStylesheet(`${siteBase}site-refinement.css?v=20260808-2`);
  }

  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
})();
