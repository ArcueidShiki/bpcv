#!/usr/bin/env python3
"""Assemble the PWA from the pages that already exist.

There is deliberately no build step here in the usual sense. The handbooks
and the playground are single-file, make zero external requests, and already
carry the whole engine and all 305 lessons — so a Progressive Web App is that
set of pages plus three things they lack:

  manifest.webmanifest   so the browser offers to install it
  sw.js                  so it works with the network off
  icons                  because a manifest without them will not install

Porting anything would create a second copy of the engine to keep in sync,
which is the failure this project has spent its whole life avoiding.

Two constraints are worth stating because they are easy to get wrong:

* A service worker cannot be registered from `file://`. The output must be
  served over http(s) — `python3 -m http.server` is enough to verify it, and
  `tools/verify_pwa.py` does exactly that.
* The cache name is derived from a hash of the precached files. Without that,
  an updated handbook is invisible to anyone who has already installed the
  app: the old service worker keeps serving the old cache forever.

Usage:  python3 tools/build_pwa.py [outdir]
"""
import hashlib
import json
import pathlib
import shutil
import struct
import sys
import zlib

REPO = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_OUT = pathlib.Path(
    "/Users/arcueidpeng/github/finance/domain-knowledge/apps/pwa"
)

# Everything the app needs offline. Order is not significant; the hash of the
# contents is.
PAGES = [
    ("playground.html", "Trading Dojo", "交易道场",
     "305 guided lessons across orders, indicators and options"),
    ("orders.html", "Orders", "订单手册", "25 order types and what each one actually promises"),
    ("indicators.html", "Indicators", "指标手册", "191 technical and fundamental indicators"),
    ("options.html", "Options", "期权手册", "86 option factors, greeks and structures"),
    ("math.html", "Math for Finance", "金融数学", "Derivatives through Kelly, with 21 interactive plots"),
]

THEME = "#ff7a00"
BACKGROUND = "#0e0f13"


# --------------------------------------------------------------------------- icons

def png(size: int, *, maskable: bool) -> bytes:
    """A PNG written by hand, so the build needs no image library.

    The icon is the project's mark: an orange candle on the terminal
    background. A maskable variant insets it, because Android crops a
    maskable icon to whatever shape the launcher uses and anything within
    10% of the edge can be cut off.
    """
    fg = (255, 122, 0)
    bg = (14, 15, 19)
    wick = (255, 200, 120)

    inset = 0.28 if maskable else 0.20
    body_w = int(size * (0.5 - inset * 0.5))
    body_h = int(size * (1 - inset * 2) * 0.62)
    cx, cy = size // 2, size // 2

    rows = []
    for y in range(size):
        row = bytearray([0])           # filter byte 0 (None) per scanline
        for x in range(size):
            in_body = abs(x - cx) <= body_w // 2 and abs(y - cy) <= body_h // 2
            in_wick = abs(x - cx) <= max(1, size // 32) and \
                abs(y - cy) <= int(size * (1 - inset * 2) * 0.5)
            colour = fg if in_body else (wick if in_wick else bg)
            row += bytes(colour)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9))
            + chunk(b"IEND", b""))


# --------------------------------------------------------------------------- shell

REGISTER = """
<script>
/* Service-worker registration. Silent on failure by design: the pages work
   perfectly without a worker, and a console error on file:// — where
   registration is not permitted at all — would be noise rather than a fault. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}
</script>
"""


def manifest_html(page: str) -> str:
    return ('<link rel="manifest" href="manifest.webmanifest">'
            f'<meta name="theme-color" content="{THEME}">'
            '<link rel="apple-touch-icon" href="icons/icon-192.png">'
            '<meta name="apple-mobile-web-app-capable" content="yes">'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">')


def inject(html: str, page: str) -> str:
    """Add the manifest link and the registration script to a copied page.

    Registering from every page rather than only from the index means a user
    who deep-links into a single lesson still gets the app installed and
    cached, which is how the handbook entry points are actually used.
    """
    if "</head>" in html:
        html = html.replace("</head>", manifest_html(page) + "</head>", 1)
    if "</body>" in html:
        html = html.replace("</body>", REGISTER + "</body>", 1)
    else:
        html += REGISTER
    return html


def index_html() -> str:
    cards = "\n".join(
        f'''      <a class="card" href="{name}">
        <span class="en">{en}</span><span class="zh">{zh}</span>
        <span class="sub">{sub}</span>
      </a>'''
        for name, en, zh, sub in PAGES)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Finance Dojo</title>
{manifest_html("index.html")}
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; padding: 28px 20px 40px;
    background: {BACKGROUND};
    color: #eaecef;
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif;
    max-width: 720px; margin-inline: auto;
  }}
  h1 {{ font-size: 26px; margin: 0 0 4px; letter-spacing: -0.01em; }}
  .lede {{ color: #99a1ad; margin: 0 0 26px; font-size: 14px; }}
  .grid {{ display: grid; gap: 10px; }}
  .card {{
    display: block; padding: 15px 16px; border-radius: 11px;
    background: #16181e; border: 1px solid #262a33;
    text-decoration: none; color: inherit;
  }}
  .card:active {{ background: #1c1f27; }}
  .en {{ font-weight: 600; }}
  .zh {{ color: #99a1ad; margin-left: 8px; font-size: 13px; }}
  .sub {{ display: block; color: #62697a; font-size: 12.5px; margin-top: 3px; }}
  footer {{ margin-top: 28px; color: #62697a; font-size: 12px; }}
  code {{ color: {THEME}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }}
</style>
</head>
<body>
  <h1>Finance Dojo</h1>
  <p class="lede">302 handbook entries and 305 guided lessons. Everything runs
  locally — there is no backend and no network call after the first load.</p>
  <div class="grid">
{cards}
  </div>
  <footer>Install from your browser's menu to run it offline.
  Rebuilt with <code>tools/build_pwa.py</code>.</footer>
{REGISTER}
</body>
</html>
'''


def service_worker(cache: str, assets: list[str]) -> str:
    listing = ",\n  ".join(json.dumps(a) for a in assets)
    return f'''/* Service worker for Finance Dojo.

   Cache-first, because every asset here is a versioned build artefact rather
   than live data: nothing in this app changes between deploys, so going to the
   network first would only add latency and a failure mode.

   CACHE is derived from a hash of the precached files. That is what makes an
   updated handbook actually reach an installed app — with a fixed name the old
   worker would serve the old cache indefinitely, and the update would be
   invisible rather than merely late.
*/
const CACHE = {json.dumps(cache)};
const ASSETS = [
  {listing}
];

self.addEventListener('install', event => {{
  // skipWaiting so a rebuild takes effect on the next load rather than
  // waiting for every tab to close.
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
}});

self.addEventListener('activate', event => {{
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener('fetch', event => {{
  // Only same-origin GETs. The app makes no cross-origin requests at all, so
  // anything else is not ours to answer.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request, {{ ignoreSearch: true }}).then(hit => {{
      if (hit) return hit;
      return fetch(event.request).catch(() => {{
        // Offline and not precached: a navigation falls back to the index so
        // the app opens rather than showing the browser's error page.
        if (event.request.mode === 'navigate') return caches.match('index.html');
        return new Response('', {{ status: 504, statusText: 'offline' }});
      }});
    }})
  );
}});
'''


def main() -> int:
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    (out / "icons").mkdir(parents=True, exist_ok=True)

    missing = [n for n, *_ in PAGES if not (REPO / n).exists()]
    if missing:
        print(f"ERROR source pages not found: {missing}")
        return 1

    digest = hashlib.sha256()
    for name, *_ in PAGES:
        html = (REPO / name).read_text(encoding="utf-8")
        digest.update(html.encode("utf-8"))
        (out / name).write_text(inject(html, name), encoding="utf-8")

    index = index_html()
    digest.update(index.encode("utf-8"))
    (out / "index.html").write_text(index, encoding="utf-8")

    icons = []
    for size in (192, 512):
        for maskable in (False, True):
            fname = f"icons/icon-{size}{'-maskable' if maskable else ''}.png"
            data = png(size, maskable=maskable)
            (out / fname).write_bytes(data)
            digest.update(data)
            icons.append({
                "src": fname, "sizes": f"{size}x{size}", "type": "image/png",
                "purpose": "maskable" if maskable else "any",
            })

    manifest = {
        "name": "Finance Dojo — handbooks and trading lessons",
        "short_name": "Finance Dojo",
        "description": "302 handbook entries and 305 guided trading lessons, "
                       "running entirely on-device.",
        "start_url": "index.html",
        "scope": "./",
        "display": "standalone",
        "orientation": "any",
        "background_color": BACKGROUND,
        "theme_color": THEME,
        "lang": "en",
        "icons": icons,
        "shortcuts": [
            {"name": "Trading Dojo", "url": "playground.html"},
            {"name": "Orders", "url": "orders.html"},
        ],
    }
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2)
    digest.update(manifest_text.encode("utf-8"))
    (out / "manifest.webmanifest").write_text(manifest_text, encoding="utf-8")

    assets = ["index.html", "manifest.webmanifest"] + [n for n, *_ in PAGES] \
        + [i["src"] for i in icons]
    (out / "sw.js").write_text(
        service_worker("dojo-" + digest.hexdigest()[:12], assets), encoding="utf-8")

    total = sum((out / a).stat().st_size for a in assets) + (out / "sw.js").stat().st_size
    print(f"pwa     : {out}")
    print(f"assets  : {len(assets) + 1}  ({total / 1048576:.1f} MB precached)")
    print(f"cache   : dojo-{digest.hexdigest()[:12]}")
    print("verify  : python3 tools/verify_pwa.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
