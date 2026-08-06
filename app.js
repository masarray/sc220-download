(() => {
  "use strict";

  const fallback = {
    version: "0.1.0",
    published: "2026-08-06",
    download: "https://github.com/masarray/sc220-download/releases",
    sha256: "c8a441f07605f48805233fbddf466312c1de733c647c95705317ad13ee2b7b04"
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("id-ID", {
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

  fetch("latest.json", { cache: "no-store" })
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
      copyButton.querySelector("span").textContent = "Tersalin";
      toast?.classList.add("show");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast?.classList.remove("show");
        copyButton.querySelector("span").textContent = "Salin";
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

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
