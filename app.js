(() => {
  "use strict";

  const fallback = {
    version: "0.1.0",
    published: "2026-08-06",
    download: "https://github.com/masarray/sc220-download/releases",
    sha256: "c8a441f07605f48805233fbddf466312c1de733c647c95705317ad13ee2b7b04"
  };

  const html = document.documentElement;
  const isEnglish = html.lang.toLowerCase().startsWith("en");
  const locale = isEnglish ? "en-US" : "id-ID";
  const releaseSource = html.dataset.releaseSource || "latest.json";

  const copyLabels = isEnglish
    ? { idle: "Copy", done: "Copied" }
    : { idle: "Salin", done: "Tersalin" };

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
    const published = formatDate(release.published || fallback.published);
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

  const installHardwareGuidePromo = () => {
    const path = window.location.pathname.replace(/\/+$/, "/");
    const isLandingPage = /\/sc220-download\/(?:en\/)?$/.test(path);
    if (!isLandingPage || document.querySelector(".hardware-guide-section")) return;

    const guideHref = isEnglish
      ? "sc220-mkii-audio-interface/"
      : "sc220-mkii-audio-interface/";
    const stylesheetHref = isEnglish ? "../sc220-mkii.css" : "sc220-mkii.css";

    if (!document.querySelector(`link[href="${stylesheetHref}"]`)) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = stylesheetHref;
      document.head.appendChild(stylesheet);
    }

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
      ? `<div class="hardware-guide-shell"><div><p class="kicker dark"><span></span> SC220 MKII HARDWARE GUIDE</p><h2 id="sc220-mkii-guide-title">Understand the interface before connecting it.</h2><p>Read public specifications, control functions, microphone and karaoke-processor wiring, a compatibility matrix, OBS setup, and troubleshooting. SC220 Live compatibility with the MKII is clearly marked as unverified until a physical unit is tested.</p></div><article class="hardware-guide-card"><small>RECORDING TECH SC220 MKII / MK2</small><ul><li>24-bit / 192 kHz public claim</li><li>Two combo mic, line, or instrument inputs</li><li>+48 V, −20 dB PAD, USB-C, OTG, and direct-monitoring claims</li><li>Driver, ASIO, loopback, and endpoint status</li></ul><a href="${guideHref}">Open the SC220 MKII guide <span aria-hidden="true">→</span></a></article></div>`
      : `<div class="hardware-guide-shell"><div><p class="kicker dark"><span></span> PANDUAN HARDWARE SC220 MKII</p><h2 id="sc220-mkii-guide-title">Pahami audio interface sebelum menyambungkannya.</h2><p>Pelajari spesifikasi publik, fungsi kontrol, wiring microphone dan karaoke processor, compatibility matrix, setup OBS, serta troubleshooting. Kompatibilitas SC220 Live dengan MKII ditandai belum terverifikasi sampai unit fisik diuji.</p></div><article class="hardware-guide-card"><small>RECORDING TECH SC220 MKII / MK2</small><ul><li>Klaim publik 24-bit / 192 kHz</li><li>Dua combo input mic, line, atau instrument</li><li>Klaim +48 V, PAD −20 dB, USB-C, OTG, dan direct monitoring</li><li>Status driver, ASIO, loopback, dan endpoint</li></ul><a href="${guideHref}">Buka panduan SC220 MKII <span aria-hidden="true">→</span></a></article></div>`;

    const k500Section = document.querySelector(".topic-section");
    const setupSection = document.querySelector(".setup-section");
    const target = k500Section || setupSection;
    if (target?.parentNode) target.parentNode.insertBefore(section, target);
  };

  installHardwareGuidePromo();

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();