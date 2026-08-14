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

  installP1GuidePromo();

  if (isLandingPage) {
    initFeatureTour();
    initReveal();
    initProductTilt();
  } else {
    ensureStylesheet(`${siteBase}site-refinement.css?v=20260808-2`);
  }

  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
})();
