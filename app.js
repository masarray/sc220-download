(() => {
  "use strict";

  const fallback = {
    version: "0.1.1",
    published: "2026-08-10",
    download: "https://github.com/masarray/sc220-download/releases/download/v0.1.1/SC220-Live-v0.1.1-Setup-win-x64.exe",
    sha256: "589b174357cb36c62611d7a0e89bfa6a7d25251fc27015b5dd5b25fb54c04686"
  };

  const html = document.documentElement;
  const isEnglish = html.lang.toLowerCase().startsWith("en");
  const locale = isEnglish ? "en-US" : "id-ID";
  const releaseSource = html.dataset.releaseSource || "latest.json";
  const normalizedPath = window.location.pathname.replace(/\/+$/, "/") || "/";
  const isGitHubPagesMirror = normalizedPath.startsWith("/sc220-download/");
  const siteBase = isGitHubPagesMirror ? "/sc220-download/" : "/";

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

    // Keep rendered SoftwareApplication structured data synchronized with latest.json.
    // Static HTML remains readable without JavaScript; this updates dynamic release fields
    // whenever a newer verified release is published.
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
    if (document.querySelector(`link[href="${href}"]`)) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = href;
    document.head.appendChild(stylesheet);
  };

  const installHardwareGuidePromo = () => {
    const isLandingPage = /^(?:\/|\/en\/|\/sc220-download\/|\/sc220-download\/en\/)$/.test(normalizedPath);
    if (!isLandingPage || document.querySelector(".hardware-guide-section")) return;

    const guideHref = "sc220-mkii-audio-interface/";
    const setupHref = "sc220-mkii-audio-interface/setup/";
    const supportHref = "sc220-mkii-audio-interface/support/";
    const stylesheetHref = isEnglish ? "../sc220-mkii.css" : "sc220-mkii.css";
    const p1StylesheetHref = isEnglish ? "../sc220-mkii-p1.css" : "sc220-mkii-p1.css";
    ensureStylesheet(stylesheetHref);
    ensureStylesheet(p1StylesheetHref);

    const nav = document.querySelector(".desktop-nav");
    if (nav && !nav.querySelector("[data-sc220-mkii-link]")) {
      const navLink = document.createElement("a");
      navLink.href = guideHref;
      navLink.dataset.sc220MkiiLink = "";
      navLink.textContent = "SC220 MKII";
      const k500Link = Array.from(nav.querySelectorAll("a")).find((link) => link.href.includes("ktv-k500"));
      nav.insertBefore(navLink, k500Link || nav.firstChild);
    }

    const section = document.createElement("section");
    section.className = "hardware-guide-section";
    section.setAttribute("aria-labelledby", "sc220-mkii-guide-title");
    section.innerHTML = isEnglish
      ? `<div class="hardware-guide-shell"><div><p class="kicker dark"><span></span> SC220 MKII HARDWARE GUIDE</p><h2 id="sc220-mkii-guide-title">Understand the interface before connecting it.</h2><p>Read public specifications, control functions, wiring, compatibility status, goal-based setup, gain staging, and a complete support checklist.</p></div><article class="hardware-guide-card"><small>RECORDING TECH SC220 MKII / MK2</small><ul><li>Public hardware claims and verification status</li><li>Microphone, instrument, processor, and streaming routes</li><li>Goal-based setup and gain staging</li><li>Diagnostic checklist and issue template</li></ul><a href="${guideHref}">Open the hardware guide <span aria-hidden="true">→</span></a><div class="hardware-subnav"><a href="${setupHref}">Setup by goal</a><a href="${supportHref}">Driver & support</a></div></article></div>`
      : `<div class="hardware-guide-shell"><div><p class="kicker dark"><span></span> PANDUAN HARDWARE SC220 MKII</p><h2 id="sc220-mkii-guide-title">Pahami audio interface sebelum menyambungkannya.</h2><p>Pelajari spesifikasi publik, fungsi kontrol, wiring, status kompatibilitas, setup berdasarkan tujuan, gain staging, dan checklist support lengkap.</p></div><article class="hardware-guide-card"><small>RECORDING TECH SC220 MKII / MK2</small><ul><li>Klaim hardware publik dan status verifikasi</li><li>Rute microphone, instrumen, processor, dan streaming</li><li>Setup berdasarkan tujuan dan gain staging</li><li>Checklist diagnosis dan template issue</li></ul><a href="${guideHref}">Buka panduan hardware <span aria-hidden="true">→</span></a><div class="hardware-subnav"><a href="${setupHref}">Setup berdasarkan tujuan</a><a href="${supportHref}">Driver & support</a></div></article></div>`;

    const k500Section = document.querySelector(".topic-section");
    const setupSection = document.querySelector(".setup-section");
    const target = k500Section || setupSection;
    if (target?.parentNode) target.parentNode.insertBefore(section, target);
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

  installHardwareGuidePromo();
  installP1GuidePromo();

  // Keep a single refinement stylesheet path working on both Cloudflare root and GitHub Pages mirror.
  ensureStylesheet(`${siteBase}site-refinement.css?v=20260808-2`);

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
