#!/usr/bin/env python3
"""Prove the PWA actually installs and actually works offline.

"It renders" is not evidence of either. A page can look perfect and register
no service worker at all, and a service worker can register and still fail to
serve a single byte with the network down. Both of those ship silently.

So this serves the build over http — service workers cannot register from
`file://`, which is the single most common reason a local PWA check passes
against nothing — and then asserts, in order:

  1. the worker registers and reaches `activated`
  2. the manifest parses and its icons are real PNGs of the size they claim
  3. with the network cut, every page still loads from cache
  4. with the network cut, the playground still has all 305 lessons and its
     engine still computes — the app is usable offline, not merely visible
  5. nothing was ever requested cross-origin

Usage:  python3 tools/verify_pwa.py [dir]
"""
import functools
import http.server
import json
import pathlib
import socketserver
import struct
import sys
import threading

from playwright.sync_api import sync_playwright

DEFAULT_DIR = pathlib.Path(
    "/Users/arcueidpeng/github/finance/domain-knowledge/apps/pwa"
)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):        # the access log is noise here
        pass


def serve(directory: pathlib.Path):
    handler = functools.partial(QuietHandler, directory=str(directory))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, httpd.server_address[1]


def png_size(path: pathlib.Path) -> tuple[int, int]:
    """Width and height straight out of the IHDR, so a corrupt or mislabelled
    icon is caught rather than trusted from its filename."""
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path.name} is not a PNG")
    w, h = struct.unpack(">II", data[16:24])
    return w, h


def main() -> int:
    root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DIR
    if not (root / "sw.js").exists():
        print(f"ERROR no build at {root} — run tools/build_pwa.py first")
        return 1

    failures: list[str] = []

    def check(ok: bool, label: str, detail: str = ""):
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}{'  ' + detail if detail else ''}")
        if not ok:
            failures.append(label)

    # ---- manifest and icons, before a browser is involved at all
    manifest = json.loads((root / "manifest.webmanifest").read_text(encoding="utf-8"))
    check(manifest.get("start_url") == "index.html", "manifest start_url")
    check(manifest.get("display") == "standalone", "manifest display standalone")
    has_maskable = any(i.get("purpose") == "maskable" for i in manifest["icons"])
    check(has_maskable, "manifest has a maskable icon")
    for icon in manifest["icons"]:
        want = int(icon["sizes"].split("x")[0])
        got = png_size(root / icon["src"])
        check(got == (want, want), f"icon {icon['src']}", f"{got[0]}x{got[1]}")

    httpd, port = serve(root)
    base = f"http://127.0.0.1:{port}/"
    external: list[str] = []

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            context = browser.new_context(service_workers="allow")
            context.on("request", lambda r: external.append(r.url)
                       if not r.url.startswith((base, "data:", "blob:")) else None)
            page = context.new_page()

            page.goto(base + "index.html")
            # `serviceWorker.ready` resolves as soon as there IS an active
            # worker, which with skipWaiting() can be mid-'activating'. Polling
            # for the terminal state avoids a check that fails on timing while
            # the worker is in fact fine.
            state = page.evaluate("""async () => {
              const reg = await navigator.serviceWorker.ready;
              for (let i = 0; i < 50; i++) {
                if (reg.active && reg.active.state === 'activated') return 'activated';
                await new Promise(r => setTimeout(r, 100));
              }
              return reg.active ? reg.active.state : 'none';
            }""")
            check(state == "activated", "service worker activated", state)

            # Compared against the worker's own ASSETS list rather than a
            # number written here: a magic constant drifts the moment a page is
            # added, and reports a build problem that does not exist.
            declared = json.loads("[" + (root / "sw.js").read_text(encoding="utf-8")
                                  .split("const ASSETS = [")[1].split("];")[0] + "]")
            cached = page.evaluate("""async () => {
              const names = await caches.keys();
              if (!names.length) return 0;
              return (await (await caches.open(names[0])).keys()).length;
            }""")
            check(cached == len(declared), "every declared asset precached",
                  f"{cached}/{len(declared)}")

            # Warm every page so the cache holds what it claims to.
            for name in ["playground.html", "orders.html", "indicators.html",
                         "options.html", "math.html"]:
                page.goto(base + name)
                page.wait_for_timeout(400)

            # ---- the actual test: cut the network
            context.set_offline(True)

            page.goto(base + "index.html")
            title = page.title()
            check(title == "Finance Dojo", "index loads offline", title)

            page.goto(base + "playground.html")
            page.wait_for_timeout(2500)
            lessons = page.evaluate("() => (window.PG && PG.LESSONS || []).length")
            check(lessons == 305, "305 lessons offline", str(lessons))

            # Visible, and working. A cached page whose engine never ran would
            # pass every check above and be useless.
            computed = page.evaluate("""() => {
              const t = PG.Sim.tape({regime:'gap_down', seed:'pwa-check', bars:90,
                                     p0:100, gapAt:58, gapPct:-0.06});
              const f = PG.Sim.ENGINE.STP({n:t.n, bars:t.bars, seed:t.seed},
                                          {side:'sell', qty:1000, stop:98, from:0});
              return {bars: t.n, filled: f.filled, px: f.px};
            }""")
            check(computed["bars"] == 90 and computed["filled"] == 1000
                  and computed["px"] is not None,
                  "engine runs offline", f"filled {computed['filled']} @ {computed['px']:.2f}")

            for name in ["orders.html", "indicators.html", "options.html", "math.html"]:
                page.goto(base + name)
                page.wait_for_timeout(600)
                entries = page.evaluate(
                    "() => document.querySelectorAll('canvas, .entry, section').length")
                check(entries > 0, f"{name} loads offline", f"{entries} nodes")

            context.set_offline(False)
            browser.close()
    finally:
        httpd.shutdown()

    check(not external, "no cross-origin requests",
          "" if not external else f"{len(external)}: {external[:3]}")

    print()
    if failures:
        print(f"FAILED {len(failures)}: {failures}")
        return 1
    print("PWA VERIFIED — installs, caches, and runs with the network off")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
