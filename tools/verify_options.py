#!/usr/bin/env python3
"""Regression check for the options handbook and its strategy screener.

`options.html` is a build artefact of `finance/domain-knowledge/option/site`.
It carries three layers that were once hand-spliced into the built file and are
now generated from source — the formula typesetter, 1,494 per-line bilingual
annotations, and the Black-Scholes teardown — so the first job here is proving
the build still produces them.

The second job is the screener, which needs more than "it renders". A sortable
table of 31 strategies with a win-rate column is a dangerous artifact if it is
even slightly wrong about risk, so this asserts the specific properties that
keep it honest:

  · win rate is never the default sort — a screener that opens on a
    leaderboard has already made the claim the page exists to refute;
  · ranking by win rate surfaces unbounded-loss structures at the top AND
    raises the explanation, because that is the moment of misreading;
  · unbounded loss reports as ∞, never as a clipped finite number;
  · expected value is ~0 for every structure on a FLAT surface — that is the
    construction, and if it ever stops holding the integration is broken;
  · two-expiry structures are shown but unranked, never given a fabricated
    terminal win rate for a trade that is closed before that expiry;
  · column headings are translated, not raw i18n keys.

Usage:  python3 tools/verify_options.py [path/to/options.html]
"""
import pathlib
import shutil
import subprocess
import sys
import tempfile

from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parent.parent
DEFAULT = REPO / "options.html"
SOURCE = pathlib.Path(
    "/Users/arcueidpeng/github/finance/domain-knowledge/option/site"
)


def drift_check(shipped: pathlib.Path) -> tuple[bool, str]:
    """Has the built file been hand-edited since it was generated?

    The source lives in a different repository from the artefact, by design.
    That is a structure someone can work with, but only if a hand-edit to the
    built file is DISCOVERED rather than found out a year later when a rebuild
    silently deletes it — which is exactly what happened to the formula
    typesetter and the 1,494 annotations once already.

    Absent source is not a failure: this script must still be useful on a
    machine that only has bpcv.
    """
    if not (SOURCE / "build.js").exists():
        return True, "source tree not present — drift check skipped"
    if shutil.which("node") is None:
        return True, "node not installed — drift check skipped"
    with tempfile.TemporaryDirectory() as tmp:
        fresh = pathlib.Path(tmp) / "options.html"
        r = subprocess.run(["node", "build.js", str(fresh)], cwd=SOURCE,
                           capture_output=True, text=True)
        if r.returncode != 0:
            return False, f"rebuild failed: {r.stderr.strip()[:120]}"
        if fresh.read_bytes() == shipped.read_bytes():
            return True, "shipped file matches a fresh build"
        a, b = fresh.read_text(encoding="utf-8"), shipped.read_text(encoding="utf-8")
        return False, (f"shipped file differs from a fresh build "
                       f"({len(b) - len(a):+d} bytes) — it was hand-edited, and the "
                       f"next rebuild will discard the change")


def main() -> int:
    page_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    if not page_path.exists():
        print(f"ERROR {page_path} not found")
        return 1

    failures: list[str] = []

    def check(ok: bool, label: str, detail: object = ""):
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}{'  ' + str(detail) if detail else ''}")
        if not ok:
            failures.append(label)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto("file://" + str(page_path))
        page.wait_for_timeout(3500)

        check(not errors, "no page errors", errors[0][:120] if errors else "")

        ok, detail = drift_check(page_path)
        check(ok, "built file is in sync with its source", detail)

        # ---- the ported layers -------------------------------------------
        entries = page.evaluate("() => Object.keys(FIN.DOC).length")
        notes = page.evaluate("() => Object.keys(FIN.FXZH || {}).length")
        lines = page.evaluate("""() => Object.values(FIN.FXZH || {}).reduce((n, byLang) =>
            n + Object.values(byLang).reduce((m, byIx) => m + Object.keys(byIx).length, 0), 0)""")
        check(entries == 86, "86 encyclopedia entries", entries)
        check(notes == 86, "86 annotated entries", notes)
        check(lines == 1494, "1,494 annotated formula lines", lines)
        check(page.evaluate("() => !!(FIN.FX && FIN.FX.render)"), "formula typesetter present")
        check(page.evaluate("() => !!document.getElementById('engine')"), "engine room present")

        # A formula must actually typeset, and its legend must stay domain
        # scoped — `K` is a strike here and a band multiplier in Bollinger.
        rendered = page.evaluate("() => FIN.FX.render(FIN.DOC.DELTA.formula, (FIN.FXZH.DELTA||{}).zh||{})")
        check(len(rendered) > 200 and "THREW" not in rendered, "formulas typeset", len(rendered))

        # ---- the screener -------------------------------------------------
        rows = page.eval_on_selector_all("#scrTable tbody tr", "els => els.length")
        check(rows == 31, "all 31 strategies listed", rows)

        heads = page.eval_on_selector_all("#scrTable th", "els => els.map(e => e.textContent.trim())")
        raw = [h for h in heads if h.startswith("sc") and " " not in h]
        check(not raw, "column headings are translated, not i18n keys", raw)

        default_sort = page.eval_on_selector("#scrTable th.on", "el => el.dataset.sk")
        check(default_sort == "name", "default sort is not win rate", default_sort)
        check(not page.eval_on_selector("#scrWarn", "el => el.offsetParent !== null"),
              "no warning shown by default")

        # Expected value is zero by construction on a flat surface. With the
        # smile on it is not, and that residual is the skew rather than edge —
        # so the construction is what gets asserted.
        flat = page.evaluate("""() => Object.keys(FIN.STRAT).map(id => {
            const p = FIN.build(id, {S:100, w:0.05, dte:30, iv:0.35, tick:1, smile:false});
            const exp = new Set(p.legs.filter(L => L.t !== 'S').map(L => L.T.toFixed(6)));
            if (exp.size > 1) return null;
            const a = FIN.M.analyse(p, 100, 0.04, 0, 100);
            return {id: id, frac: Math.abs(a.ev) / Math.max(1, Math.abs(a.risk))};
          }).filter(Boolean)""")
        worst = max(flat, key=lambda r: r["frac"])
        check(worst["frac"] < 0.005, "expected value is zero on a flat surface",
              f"worst {worst['id']} {worst['frac']*100:.2f}%")

        # Stock legs carry their quantity in SHARES while cost/pl work in
        # per-contract-share units. Getting that conversion wrong multiplies
        # every stock-leg strategy by 100 — the shipped page reported a covered
        # call as risking $999,795 instead of $9,800, and showed its capped
        # upside as unlimited. Hand-checkable values, so they are asserted
        # rather than merely bounded.
        stock = page.evaluate("""() => {
            const o = {S:100, w:0.05, dte:30, iv:0.35, tick:1};
            const r = {};
            ['COVERED_CALL','PROTECTIVE_PUT','COLLAR','SYNTHETIC_PUT'].forEach(id => {
              const a = FIN.M.analyse(FIN.build(id, o), 100, 0.04, 0, 100);
              r[id] = {maxP: a.maxProfit, maxL: a.maxLoss, cost: a.cost, delta: a.greeks.delta};
            });
            return r;
          }""")
        cc = stock["COVERED_CALL"]
        check(9000 < cc["cost"] < 10500, "covered call costs about one round lot",
              f"${cc['cost']:.0f}")
        check(cc["maxP"] is not None and cc["maxP"] < 2000,
              "covered call upside is capped, not unlimited", cc["maxP"])
        check(-10500 < cc["maxL"] < -9000, "covered call risks the lot, not 100x it",
              f"${cc['maxL']:.0f}")
        check(abs(cc["delta"] - 100) < 2, "covered call is ~100 delta", cc["delta"])
        col = stock["COLLAR"]
        check(col["maxP"] is not None and col["maxL"] is not None
              and abs(col["maxP"]) < 2000 and abs(col["maxL"]) < 2000,
              "collar is capped on both sides",
              f"+${col['maxP']:.0f} / ${col['maxL']:.0f}")

        # Ranking by win rate: the dangerous ones must surface, with the reason.
        page.eval_on_selector("#scrTable th[data-sk=pop]", "el => el.click()")
        page.wait_for_timeout(300)
        ranked = page.evaluate("""() => FIN.SCREEN.sorted(FIN.SCREEN.filtered(FIN.SCREEN.rows()))
            .filter(r => r.comparable).map(r => ({id:r.id, pop:r.pop, defined:r.defined, cvar:r.cvar}))""")
        check(all(ranked[i]["pop"] >= ranked[i+1]["pop"] - 1e-9 for i in range(len(ranked)-1)),
              "win-rate sort is descending",
              f"{ranked[0]['pop']*100:.0f}% … {ranked[-1]['pop']*100:.0f}%")
        check(any(not r["defined"] for r in ranked[:3]),
              "an unbounded-loss structure tops the win-rate ranking",
              ranked[0]["id"])
        warn = page.eval_on_selector("#scrWarn", "el => el.offsetParent !== null && el.textContent")
        check(bool(warn) and ("max loss" in str(warn).lower() or "最大亏损" in str(warn)),
              "warning appears and names max loss")

        for r in ranked[:3]:
            print(f"          {r['id']:22s} pop {r['pop']*100:5.1f}%  "
                  f"{'UNBOUNDED loss' if not r['defined'] else 'defined risk '}  CVaR {r['cvar']:.0f}")

        # Unbounded must print as infinity, never as a clipped number.
        inf_cells = page.eval_on_selector_all(
            "#scrTable tbody td.warn", "els => els.map(e => e.textContent.trim())")
        check(all("∞" in c for c in inf_cells) and inf_cells,
              "unbounded loss renders as ∞, not a clipped figure", inf_cells[:3])

        # Two-expiry structures: shown, unranked, never fabricated.
        na = page.evaluate("() => FIN.SCREEN.rows().filter(r => !r.comparable).map(r => r.id).sort()")
        check(na == ["CALENDAR_SPREAD", "DIAGONAL_SPREAD"],
              "multi-expiry structures marked unrankable", na)
        dashes = page.eval_on_selector_all("#scrTable tr.na-row td.na", "els => els.length")
        check(dashes == 6 * len(na), "unrankable rows show dashes, not numbers", dashes)

        # Filters.
        page.eval_on_selector("#scrDefined", "el => { el.checked = true; el.onchange(); }")
        page.wait_for_timeout(250)
        left = page.eval_on_selector_all("#scrTable tbody tr", "els => els.length")
        unbounded_left = page.evaluate(
            "() => FIN.SCREEN.filtered(FIN.SCREEN.rows()).filter(r => !r.defined).length")
        check(unbounded_left == 0 and left < 31, "defined-risk filter removes unbounded rows", left)

        browser.close()

    print()
    if failures:
        print(f"FAILED {len(failures)}: {failures}")
        return 1
    print("OPTIONS HANDBOOK + SCREENER VERIFIED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
