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
    }, { rootMargin: "0px 0px -7%", threshold: .08 });
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
        stage.style.setProperty("--tilt-x", `${(.5 - y) * 1.8}deg`);
        stage.style.setProperty("--tilt-y", `${(x - .5) * 2.8}deg`);
        stage.style.setProperty("--glow-x", `${x * 100}%`);
        stage.style.setProperty("--glow-y", `${y * 100}%`);
      });
    }, { passive: true });
    stage.addEventListener("pointerleave", () => {
      stage.style.setProperty("--tilt-x", ".4deg");
      stage.style.setProperty("--tilt-y", "-1.4deg");
      stage.style.setProperty("--glow-x", "70%");
      stage.style.setProperty("--glow-y", "30%");
    });
  };

  const refreshLandingFaqAndLicensing = () => {
    if (!isLandingPage) return;

    const chevron = `<svg class="lucide details-chevron" aria-hidden="true"><use href="#icon-chevron-down"/></svg>`;
    const faq = document.querySelector(".faq");
    const requirements = document.querySelector(".requirements");
    const userQuestions = document.querySelector(".user-questions-section");
    const requirementsFaq = document.querySelector(".requirements-faq");

    if (faq) {
      faq.innerHTML = isEnglish
        ? `<p class="eyebrow dark" data-reveal>THE BASICS</p><h2 data-reveal style="--reveal-delay:60ms">A few things you may want to know before downloading.</h2>
          <details data-reveal style="--reveal-delay:90ms"><summary><span>Is SC220 Live free?</span>${chevron}</summary><p><strong>Yes. You can keep using SC220 Live for free.</strong> If you want to unlock the full feature set, activation is available from inside the app. There is no need to decide right away—download it, try it with your setup, and activate only when you want the full features.</p></details>
          <details data-reveal style="--reveal-delay:120ms"><summary><span>Do I need a Recording Tech SC220?</span>${chevron}</summary><p><strong>No.</strong> The SC220 is the interface we test and document most often, but SC220 Live is not locked to that hardware. Other Windows audio interfaces can be tried as long as Windows sees the device correctly and the routing suits your setup.</p></details>
          <details data-reveal style="--reveal-delay:150ms"><summary><span>Is there a Mac version?</span>${chevron}</summary><p><strong>Yes.</strong> The macOS version is distributed separately from the Windows installer shown on this page. The main download button here is for Windows x64, so make sure you choose the build that matches your operating system.</p></details>
          <details data-reveal style="--reveal-delay:180ms"><summary><span>How do I download and install it?</span>${chevron}</summary><p>Click <strong>Download SC220 Live</strong>, open the installer you just downloaded, follow the setup steps, then open SC220 Live and choose your audio interface and output. If you are new to audio routing, start with the default setup first—you can fine-tune it later.</p></details>
          <details data-reveal style="--reveal-delay:210ms"><summary><span>SmartScreen says Windows protected my PC. What should I do?</span>${chevron}</summary><p>This can happen with software from a newer developer or an app that has not built up a large SmartScreen reputation yet. <strong>If you downloaded the installer from this official page and want to continue, click “More info”, then “Run anyway”.</strong> You do not need to disable your antivirus. If you want an extra check first, compare the SHA-256 shown on this page with the file you downloaded.</p></details>
          <details data-reveal style="--reveal-delay:240ms"><summary><span>Do I have to install VB-CABLE?</span>${chevron}</summary><p>Not for every setup. VB-CABLE is useful when you need to pass the final SC220 Live mix into another Windows app as a virtual audio device, for example OBS or TikTok Live Studio. If your hardware or routing already provides the path you need, your setup may be different.</p></details>
          <details data-reveal style="--reveal-delay:270ms"><summary><span>Is SC220 Live a karaoke song player?</span>${chevron}</summary><p>No. SC220 Live handles <strong>mixing, sound processing, metering, and routing</strong>. It does not provide a song catalogue or lyrics. Use your usual karaoke or playback app for the music, then bring that audio into SC220 Live.</p></details>
          <details data-reveal style="--reveal-delay:300ms"><summary><span>Can I use it with OBS or TikTok Live Studio?</span>${chevron}</summary><p>Yes. That is one of the common workflows. Send the final mix to a suitable Windows audio endpoint, then choose that same endpoint as the audio input inside OBS, TikTok Live Studio, or another compatible app.</p></details>`
        : `<p class="eyebrow dark" data-reveal>PERTANYAAN DASAR</p><h2 data-reveal style="--reveal-delay:60ms">Sebelum download, mungkin ini yang ingin Anda tanyakan.</h2>
          <details data-reveal style="--reveal-delay:90ms"><summary><span>SC220 Live gratis atau berbayar?</span>${chevron}</summary><p><strong>Bisa dipakai gratis selamanya.</strong> Kalau Anda ingin membuka seluruh fitur, aktivasi tersedia dari dalam aplikasi. Jadi tidak perlu buru-buru memutuskan—download, coba dulu di setup Anda, lalu aktivasi kalau memang ingin memakai full fitur.</p></details>
          <details data-reveal style="--reveal-delay:120ms"><summary><span>Apakah harus punya Recording Tech SC220?</span>${chevron}</summary><p><strong>Tidak harus.</strong> SC220 memang perangkat yang paling sering kami uji dan dokumentasikan, tetapi aplikasinya tidak dikunci hanya untuk SC220. Audio interface lain boleh dicoba selama terbaca dengan baik di Windows dan routing-nya cocok dengan setup Anda.</p></details>
          <details data-reveal style="--reveal-delay:150ms"><summary><span>Ada versi untuk Mac?</span>${chevron}</summary><p><strong>Ada.</strong> Versi macOS didistribusikan terpisah dari installer Windows yang tampil di halaman ini. Tombol download utama di sini adalah untuk Windows x64, jadi pastikan Anda memilih build yang sesuai dengan sistem operasi yang dipakai.</p></details>
          <details data-reveal style="--reveal-delay:180ms"><summary><span>Bagaimana cara download dan install?</span>${chevron}</summary><p>Klik <strong>Unduh SC220 Live</strong>, buka installer yang baru selesai didownload, ikuti langkah setup, lalu jalankan SC220 Live dan pilih audio interface serta output yang ingin dipakai. Kalau masih awam soal routing, mulai saja dari setup yang paling sederhana dulu—nanti bisa dirapikan pelan-pelan.</p></details>
          <details data-reveal style="--reveal-delay:210ms"><summary><span>SmartScreen bilang Windows melindungi PC. Harus bagaimana?</span>${chevron}</summary><p>Ini bisa muncul pada software dari developer yang masih baru atau aplikasi yang reputasinya belum banyak terbentuk di SmartScreen. <strong>Kalau installer memang Anda download dari halaman resmi ini dan ingin melanjutkan, klik “More info”, lalu pilih “Run anyway”.</strong> Tidak perlu mematikan antivirus. Kalau ingin lebih yakin sebelum lanjut, cocokkan SHA-256 di halaman ini dengan file yang Anda download.</p></details>
          <details data-reveal style="--reveal-delay:240ms"><summary><span>Apakah harus install VB-CABLE?</span>${chevron}</summary><p>Tidak selalu. VB-CABLE berguna kalau hasil mix dari SC220 Live perlu dikirim ke aplikasi Windows lain sebagai virtual audio device, misalnya OBS atau TikTok Live Studio. Kalau hardware atau routing Anda sudah punya jalur sendiri, setup-nya bisa berbeda.</p></details>
          <details data-reveal style="--reveal-delay:270ms"><summary><span>SC220 Live itu aplikasi pemutar karaoke?</span>${chevron}</summary><p>Bukan. SC220 Live menangani <strong>mixing, pengolahan suara, meter, dan routing audio</strong>. Lagu dan lirik tetap berasal dari aplikasi karaoke atau player yang biasa Anda gunakan, lalu audionya masuk ke SC220 Live.</p></details>
          <details data-reveal style="--reveal-delay:300ms"><summary><span>Bisa dipakai untuk OBS atau TikTok Live Studio?</span>${chevron}</summary><p>Bisa. Ini salah satu workflow yang paling umum. Kirim mix akhir ke endpoint audio Windows yang sesuai, lalu pilih endpoint yang sama sebagai input audio di OBS, TikTok Live Studio, atau aplikasi kompatibel lainnya.</p></details>`;
    }

    if (requirements) {
      const heading = requirements.querySelector("h2");
      if (heading) heading.textContent = isEnglish ? "For the Windows installer on this page." : "Untuk installer Windows di halaman ini.";
    }

    const heroEyebrow = document.querySelector(".hero .eyebrow");
    if (heroEyebrow) heroEyebrow.textContent = isEnglish ? "SC220 LIVE • FREE TO USE" : "SC220 LIVE • GRATIS DIPAKAI";

    const heroTrust = Array.from(document.querySelectorAll(".hero-trust span"));
    if (heroTrust[0]) heroTrust[0].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "Free to keep using" : "Gratis dipakai selamanya"}`;
    if (heroTrust[1]) heroTrust[1].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "Full features via activation" : "Full fitur lewat aktivasi"}`;

    const confidence = document.querySelector(".confidence-item");
    if (confidence) {
      const small = confidence.querySelector("small");
      const strong = confidence.querySelector("strong");
      const text = confidence.querySelector("span");
      if (small) small.textContent = isEnglish ? "FREE TO USE" : "GRATIS SELAMANYA";
      if (strong) strong.textContent = isEnglish ? "Try it without a countdown" : "Pakai dulu tanpa takut masa habis";
      if (text) text.textContent = isEnglish ? "The free version keeps working; full features are available through activation." : "Versi gratis tetap bisa dipakai; full fitur tersedia lewat aktivasi.";
    }

    const licence = document.querySelector(".licence-section");
    if (licence) {
      const title = licence.querySelector(".licence-main h2");
      const body = licence.querySelector(".licence-main > p:not(.eyebrow)");
      const afterSmall = licence.querySelector(".licence-after small");
      const afterTitle = licence.querySelector(".licence-after h3");
      const afterBody = licence.querySelector(".licence-after p");
      if (title) title.textContent = isEnglish ? "Free to keep using. Activate when you want the full features." : "Gratis dipakai selamanya. Aktivasi kalau ingin full fitur.";
      if (body) body.textContent = isEnglish ? "Use the free version for as long as you need. Get comfortable with your own setup first, then activate from inside the app whenever the full feature set makes sense for you." : "Versi gratis tetap bisa Anda pakai tanpa takut masa coba habis. Kenali dulu workflow di setup Anda, lalu aktivasi dari dalam aplikasi kalau memang ingin membuka seluruh fitur.";
      if (afterSmall) afterSmall.textContent = isEnglish ? "FULL FEATURES" : "FULL FITUR";
      if (afterTitle) afterTitle.textContent = isEnglish ? "Activate when you are ready" : "Aktivasi saat Anda sudah siap";
      if (afterBody) afterBody.textContent = isEnglish ? "You do not have to decide before trying the app. The free version stays usable, while activation unlocks the complete feature set." : "Tidak perlu memutuskan sebelum mencoba. Versi gratis tetap bisa dipakai, sedangkan aktivasi membuka rangkaian fitur lengkap.";
    }

    const reassurance = Array.from(document.querySelectorAll(".download-reassurance span"));
    if (reassurance[0]) reassurance[0].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "Free to keep using" : "Gratis dipakai selamanya"}`;
    if (reassurance[1]) reassurance[1].innerHTML = `<svg class="lucide" aria-hidden="true"><use href="#icon-check"/></svg>${isEnglish ? "Full-feature activation available" : "Aktivasi full fitur tersedia"}`;

    if (userQuestions && requirementsFaq) {
      requirementsFaq.insertAdjacentElement("afterend", userQuestions);
      const eyebrow = userQuestions.querySelector(".questions-heading .eyebrow");
      const title = userQuestions.querySelector(".questions-heading h2");
      const lead = userQuestions.querySelector(".questions-heading > p");
      if (eyebrow) eyebrow.textContent = isEnglish ? "FROM USER COMMENTS" : "DARI KOMENTAR PENGGUNA";
      if (title) title.textContent = isEnglish ? "A few real-world questions that come up after the basics." : "Pertanyaan lanjutan yang memang sering muncul.";
      if (lead) lead.textContent = isEnglish ? "If the basics above are clear, these are the practical questions people often ask when they start matching SC220 Live to their own setup." : "Kalau pertanyaan dasar di atas sudah jelas, ini beberapa hal praktis yang sering ditanyakan saat orang mulai mencocokkan SC220 Live dengan setup mereka sendiri.";

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
    refreshLandingFaqAndLicensing();
    initFeatureTour();
    initReveal();
    initProductTilt();
  } else {
    ensureStylesheet(`${siteBase}site-refinement.css?v=20260808-2`);
  }

  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
})();