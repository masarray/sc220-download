#!/usr/bin/env python3
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY_ORIGIN = "https://masarray.github.io/sc220-download"
SCREENSHOT_ROOT = "assets/screenshot/Screenshot.webp"
SCREENSHOT_EN = "../assets/screenshot/Screenshot.webp"
SCREENSHOT_ABS = f"{LEGACY_ORIGIN}/assets/screenshot/Screenshot.webp"


def fail(message):
    raise SystemExit(message)


def replace_required(text, pattern, replacement, label, flags=0, count=0):
    updated, matches = re.subn(pattern, replacement, text, count=count, flags=flags)
    if matches == 0:
        fail(f"Missing expected field: {label}")
    return updated


def load_release():
    release = json.loads((ROOT / "latest.json").read_text(encoding="utf-8"))
    version = str(release["version"]).removeprefix("v")
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        fail(f"Invalid latest.json version: {version!r}")

    tag = f"v{version}"
    published_iso = str(release["published"])
    published_date = date.fromisoformat(published_iso)
    download = str(release["download"])
    sha256 = str(release["sha256"]).lower()
    installer = download.rsplit("/", 1)[-1]
    release_url = f"https://github.com/masarray/sc220-download/releases/tag/{tag}"
    notes_name = f"RELEASE_NOTES_{tag}.md"

    if installer != f"SC220-Live-{tag}-Setup-win-x64.exe":
        fail(f"Unexpected installer name: {installer}")
    if not re.fullmatch(r"[0-9a-f]{64}", sha256):
        fail("latest.json sha256 is invalid")
    if not (ROOT / notes_name).is_file():
        fail(f"Missing {notes_name}")
    if not (ROOT / SCREENSHOT_ROOT).is_file():
        fail(f"Missing {SCREENSHOT_ROOT}")

    months_id = (
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    )
    return {
        "version": version,
        "tag": tag,
        "published_iso": published_iso,
        "published_id": f"{published_date.day} {months_id[published_date.month - 1]} {published_date.year}",
        "published_en": f"{published_date.strftime('%B')} {published_date.day}, {published_date.year}",
        "download": download,
        "sha256": sha256,
        "installer": installer,
        "release_url": release_url,
        "notes_name": notes_name,
    }


def write(path, text):
    (ROOT / path).write_text(text, encoding="utf-8", newline="\n")


def sync_app(r):
    path = ROOT / "app.js"
    text = path.read_text(encoding="utf-8")
    fallback = (
        "const fallback = {\n"
        f'    version: "{r["version"]}",\n'
        f'    published: "{r["published_iso"]}",\n'
        f'    download: "{r["download"]}",\n'
        f'    sha256: "{r["sha256"]}"\n'
        "  };"
    )
    text = replace_required(
        text,
        r'const fallback = \{\n\s*version: "[^"]+",\n\s*published: "[^"]+",\n\s*download: "[^"]+",\n\s*sha256: "[^"]+"\n\s*\};',
        fallback,
        "app.js fallback",
    )
    write("app.js", text)


def ensure_home_schema(text, language, r):
    price_currency = "IDR" if language == "id" else "USD"
    offer_url = "https://sc220.pages.dev/download/" if language == "id" else "https://sc220.pages.dev/en/download/"
    in_language = "id-ID" if language == "id" else "en-US"

    if re.search(r'"softwareVersion":"\d+\.\d+\.\d+"', text):
        text = replace_required(
            text, r'"softwareVersion":"\d+\.\d+\.\d+"',
            f'"softwareVersion":"{r["version"]}"',
            f"{language} homepage softwareVersion",
        )
    else:
        needle = f'"inLanguage":"{in_language}",'
        insertion = (
            f'{needle}'
            f'"softwareVersion":"{r["version"]}",'
            f'"datePublished":"{r["published_iso"]}",'
            '"isAccessibleForFree":true,'
            f'"offers":{{"@type":"Offer","price":"0","priceCurrency":"{price_currency}",'
            f'"availability":"https://schema.org/InStock","url":"{offer_url}"}},'
        )
        if language == "id":
            needle = f'        "inLanguage":"{in_language}",\n'
            insertion = (
                f'        "inLanguage":"{in_language}",\n'
                f'        "softwareVersion":"{r["version"]}",\n'
                f'        "datePublished":"{r["published_iso"]}",\n'
                '        "isAccessibleForFree":true,\n'
                f'        "offers":{{"@type":"Offer","price":"0","priceCurrency":"{price_currency}",'
                f'"availability":"https://schema.org/InStock","url":"{offer_url}"}},\n'
            )
        if needle not in text:
            fail(f"Missing expected field: {language} homepage schema insertion point")
        text = text.replace(needle, insertion, 1)

    text = replace_required(
        text, r'"datePublished":"\d{4}-\d{2}-\d{2}"',
        f'"datePublished":"{r["published_iso"]}"',
        f"{language} homepage datePublished",
    )
    text = replace_required(
        text, r'"downloadUrl":"[^"]+"',
        f'"downloadUrl":"{r["download"]}"',
        f"{language} homepage downloadUrl",
    )
    text = replace_required(
        text, r'"screenshot":"[^"]+"',
        f'"screenshot":"{SCREENSHOT_ABS}"',
        f"{language} homepage screenshot schema",
    )
    return text


def sync_homepage(path_str, language, r):
    path = ROOT / path_str
    text = path.read_text(encoding="utf-8")
    text = ensure_home_schema(text, language, r)

    image_src = SCREENSHOT_ROOT if language == "id" else SCREENSHOT_EN
    text = replace_required(
        text,
        r'(<div class="product-shot"><img src=")[^"]+(")(?: width="\d+" height="\d+")?',
        rf'\1{image_src}\2',
        f"{path_str} hero screenshot",
    )

    published = r["published_id"] if language == "id" else r["published_en"]
    text = replace_required(text, r'(?<=data-version>)v\d+\.\d+\.\d+', r["tag"], f"{path_str} version labels")
    text = replace_required(text, r'(?<=data-published>)[^<]+', published, f"{path_str} published labels")
    text = replace_required(text, r'(?<=data-sha>)[0-9a-fA-F]{64}', r["sha256"], f"{path_str} checksum")
    text = replace_required(text, r'(<a class="[^"]*"[^>]*data-download-link[^>]*href=")[^"]+(")', rf'\1{r["download"]}\2', f"{path_str} download links")
    text = replace_required(text, r'(<a class="release-link"[^>]*data-release-link[^>]*href=")[^"]+(")', rf'\1{r["release_url"]}\2', f"{path_str} release link")

    if r["download"] not in text or r["sha256"] not in text or image_src not in text:
        fail(f"{path_str} failed homepage post-sync validation")
    write(path_str, text)


def sync_download_page(path_str, language, r):
    path = ROOT / path_str
    text = path.read_text(encoding="utf-8")
    match = re.search(r"SC220 Live (v\d+\.\d+\.\d+)", text)
    if not match:
        fail(f"Cannot identify SC220 release in {path_str}")
    text = text.replace(match.group(1), r["tag"])
    text = replace_required(text, r'"softwareVersion":"\d+\.\d+\.\d+"', f'"softwareVersion":"{r["version"]}"', f"{path_str} softwareVersion")
    text = replace_required(text, r'"datePublished":"\d{4}-\d{2}-\d{2}"', f'"datePublished":"{r["published_iso"]}"', f"{path_str} datePublished")
    text = replace_required(text, r'"downloadUrl":"[^"]+"', f'"downloadUrl":"{r["download"]}"', f"{path_str} schema downloadUrl")
    text = replace_required(text, r"<code data-sha>[0-9a-fA-F]{64}</code>", f'<code data-sha>{r["sha256"]}</code>', f"{path_str} checksum")
    published = r["published_id"] if language == "id" else r["published_en"]
    text = replace_required(text, r"<span data-published>[^<]+</span>", f"<span data-published>{published}</span>", f"{path_str} published label")
    text = replace_required(text, r"https://github\.com/masarray/sc220-download/releases/download/v\d+\.\d+\.\d+/SC220-Live-v\d+\.\d+\.\d+-Setup-win-x64\.exe", r["download"], f"{path_str} direct download")
    text = replace_required(text, r"https://github\.com/masarray/sc220-download/releases/tag/v\d+\.\d+\.\d+", r["release_url"], f"{path_str} release link")
    text = re.sub(r"SC220-Live-v\d+\.\d+\.\d+-Setup-win-x64\.exe", r["installer"], text)

    if language == "id":
        text = re.sub(r"<li><div><b>Installer sekitar [^<]+</b><span>Unduh langsung dari GitHub Releases\.</span></div></li>", "<li><div><b>Installer Windows x64</b><span>Unduh langsung dari GitHub Releases.</span></div></li>", text)
        text = re.sub(r"<tr><td>Ukuran installer</td><td>[^<]+</td></tr>", "<tr><td>Ukuran installer</td><td>Lihat metadata asset di GitHub Release</td></tr>", text)
        section = (
            '<section class="article-section alt" id="baru">\n'
            '  <div class="article-shell">\n'
            f'    <span class="guide-eyebrow">RILIS TERBARU {r["tag"]}</span>\n'
            '    <h2>Versi terbaru, installer terverifikasi, dan catatan perubahan resmi.</h2>\n'
            f'    <p>Halaman download ini selalu mengikuti metadata release stabil terbaru. Detail perubahan {r["tag"]}, instalasi, integritas file, dan catatan teknis tersedia pada catatan rilis resmi.</p>\n'
            f'    <p><a href="../{r["notes_name"]}">Baca catatan rilis {r["tag"]} lengkap →</a></p>\n'
            '  </div>\n</section>'
        )
        pattern = r'<section class="article-section alt" id="baru">.*?</section>'
    else:
        text = re.sub(r"<li><div><b>About [^<]+</b><span>Downloaded directly from GitHub Releases\.</span></div></li>", "<li><div><b>Windows x64 installer</b><span>Downloaded directly from GitHub Releases.</span></div></li>", text)
        text = re.sub(r"<tr><td>Installer size</td><td>[^<]+</td></tr>", "<tr><td>Installer size</td><td>See asset metadata on the GitHub Release</td></tr>", text)
        section = (
            '<section class="article-section alt" id="new">\n'
            '  <div class="article-shell">\n'
            f'    <span class="guide-eyebrow">LATEST RELEASE {r["tag"]}</span>\n'
            '    <h2>The current verified build and its official change notes.</h2>\n'
            f'    <p>This download page follows the latest stable release metadata automatically. Full {r["tag"]} changes, installation notes, file integrity details, and technical notes are available in the official release notes.</p>\n'
            f'    <p><a href="../../{r["notes_name"]}">Read the complete {r["tag"]} release notes →</a></p>\n'
            '  </div>\n</section>'
        )
        pattern = r'<section class="article-section alt" id="new">.*?</section>'

    text = replace_required(text, pattern, section, f"{path_str} latest release section", flags=re.DOTALL)
    if r["download"] not in text or r["sha256"] not in text or r["notes_name"] not in text:
        fail(f"{path_str} failed post-sync validation")
    write(path_str, text)


def sync_readme(path_str, language, r):
    path = ROOT / path_str
    text = path.read_text(encoding="utf-8")
    image_alt = "Tampilan mixer Windows SC220 Live dengan input SC220, audio PC, DSP, meter, dan output streaming" if language == "id" else "SC220 Live Windows mixer interface with SC220 input, PC audio, DSP, meters, and streaming output"
    text = replace_required(text, r'<img src="[^"]+" alt="' + re.escape(image_alt) + r'" width="960">', f'<img src="{SCREENSHOT_ROOT}" alt="{image_alt}" width="960">', f"{path_str} screenshot")

    if language == "id":
        release_block = f'''## Rilis stabil saat ini

**SC220 Live {r["tag"]}** — diterbitkan **{r["published_id"]}** untuk Windows 10/11 x64.

| Item | Rilis saat ini |
|---|---|
| Halaman download resmi | [sc220.pages.dev/download](https://sc220.pages.dev/download/) |
| Installer Windows | [{r["installer"]}]({r["download"]}) |
| Ukuran installer | Lihat metadata asset pada [GitHub Release {r["tag"]}]({r["release_url"]}) |
| Catatan rilis | [{r["notes_name"]}]({r["notes_name"]}) |
| Metadata machine-readable | [latest.json](latest.json) |
| GitHub Release | [{r["tag"]}]({r["release_url"]}) |

### Yang baru di {r["tag"]}

Lihat [{r["notes_name"]}]({r["notes_name"]}) untuk perubahan, instalasi, dan detail integritas release terbaru.

'''
        verify_block = f'''## Verifikasi installer

SHA-256 installer saat ini:

```text
{r["sha256"]}
```

Jalankan di Windows PowerShell:

```powershell
Get-FileHash .\\{r["installer"]} -Algorithm SHA256
```

Hasilnya harus sama persis dengan checksum yang dipublikasikan. Release juga menyediakan file `.sha256` dan manifest supply-chain.

> [!NOTE]
> Windows SmartScreen dapat menampilkan peringatan unknown publisher sampai sertifikat code-signing khusus aplikasi tersedia. Selalu unduh dari repository atau website resmi dan periksa SHA-256 bila ragu.

'''
        text = replace_required(text, r"## Rilis stabil saat ini\n.*?(?=## Kemampuan utama)", release_block, f"{path_str} release block", flags=re.DOTALL)
        text = replace_required(text, r"## Verifikasi installer\n.*?(?=## Cara mulai)", verify_block, f"{path_str} verify block", flags=re.DOTALL)
    else:
        release_block = f'''## Current stable release

**SC220 Live {r["tag"]}** — published **{r["published_en"]}** for Windows 10/11 x64.

| Item | Current release |
|---|---|
| Official download page | [sc220.pages.dev/en/download](https://sc220.pages.dev/en/download/) |
| Windows installer | [{r["installer"]}]({r["download"]}) |
| Installer size | See asset metadata on [GitHub Release {r["tag"]}]({r["release_url"]}) |
| Release notes | [{r["notes_name"]}]({r["notes_name"]}) |
| Machine-readable metadata | [latest.json](latest.json) |
| GitHub Release | [{r["tag"]}]({r["release_url"]}) |

### What changed in {r["tag"]}

See [{r["notes_name"]}]({r["notes_name"]}) for the latest changes, installation notes, and release-integrity details.

'''
        verify_block = f'''## Verify the installer

Current installer SHA-256:

```text
{r["sha256"]}
```

On Windows PowerShell:

```powershell
Get-FileHash .\\{r["installer"]} -Algorithm SHA256
```

The result must match the published checksum exactly. Release assets also include a `.sha256` file and a supply-chain manifest.

> [!NOTE]
> Windows SmartScreen may show an unknown-publisher warning until a dedicated application code-signing certificate is deployed. Always download from this repository or the official website and verify SHA-256 if you are unsure.

'''
        text = replace_required(text, r"## Current stable release\n.*?(?=## Core capabilities)", release_block, f"{path_str} release block", flags=re.DOTALL)
        text = replace_required(text, r"## Verify the installer\n.*?(?=## Quick start)", verify_block, f"{path_str} verify block", flags=re.DOTALL)

    text = replace_required(text, r"<strong>SC220 Live v\d+\.\d+\.\d+</strong>", f"<strong>SC220 Live {r['tag']}</strong>", f"{path_str} footer version")
    if r["download"] not in text or r["sha256"] not in text or r["notes_name"] not in text:
        fail(f"{path_str} failed README post-sync validation")
    write(path_str, text)


def sync_build_script(r):
    path_str = "scripts/build-static-site.sh"
    path = ROOT / path_str
    text = path.read_text(encoding="utf-8")
    if "import json\nfrom pathlib import Path\n" not in text:
        text = text.replace("from pathlib import Path\n", "import json\nfrom pathlib import Path\n", 1)

    text = text.replace('<img src="sc220-live-console.png" width="1680" height="945" alt=', f'<img src="{SCREENSHOT_ROOT}" alt=')
    text = text.replace('<img src="../sc220-live-console.png" width="1680" height="945" alt=', f'<img src="{SCREENSHOT_EN}" alt=')
    text = text.replace('<img src="sc220-live-console.png" width="1680" height="945" fetchpriority="high" decoding="async" alt=', f'<img src="{SCREENSHOT_ROOT}" fetchpriority="high" decoding="async" alt=')
    text = text.replace('<img src="../sc220-live-console.png" width="1680" height="945" fetchpriority="high" decoding="async" alt=', f'<img src="{SCREENSHOT_EN}" fetchpriority="high" decoding="async" alt=')

    old_schema_block = re.compile(
        r'# Homepage: provide the fields Google documents for SoftwareApplication rich-result\n'
        r'# eligibility while keeping the visible licensing/download statements consistent\.\n'
        r'replace_once\(\n'
        r'    "dist/index\.html",.*?'
        r'    "en software offers",\n'
        r'\)\n\n',
        re.DOTALL,
    )
    new_schema_block = '''# Homepage release schema is source-controlled and synchronized from latest.json.
release = json.loads(Path("dist/latest.json").read_text(encoding="utf-8"))
for page in ("dist/index.html", "dist/en/index.html"):
    page_text = Path(page).read_text(encoding="utf-8")
    expected = (
        f'"softwareVersion":"{release["version"]}"',
        f'"datePublished":"{release["published"]}"',
        f'"downloadUrl":"{release["download"]}"',
        'assets/screenshot/Screenshot.webp',
        '"offers":{"@type":"Offer","price":"0"',
    )
    missing = [item for item in expected if item not in page_text]
    if missing:
        raise SystemExit(f"Release schema drift in {page}: {missing}")

'''
    if old_schema_block.search(text):
        text = old_schema_block.sub(new_schema_block, text, count=1)
    elif "Homepage release schema is source-controlled and synchronized from latest.json." not in text:
        fail("Cannot migrate build script release-schema block")

    write(path_str, text)


def main():
    r = load_release()
    sync_app(r)
    sync_homepage("index.html", "id", r)
    sync_homepage("en/index.html", "en", r)
    sync_download_page("download/index.html", "id", r)
    sync_download_page("en/download/index.html", "en", r)
    sync_readme("README.md", "en", r)
    sync_readme("README.id.md", "id", r)
    sync_build_script(r)
    print(f"Synchronized public release surfaces to {r['tag']} from latest.json")


if __name__ == "__main__":
    main()
