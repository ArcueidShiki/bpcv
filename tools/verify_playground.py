#!/usr/bin/env python3
"""Regression sweep over the web playground.

The iOS port and the PWA both have committed verification; the page they are
both built from did not — its sweep lived in a scratch file and vanished with
the session that wrote it. This is that sweep, in the repository, so a change
to `playground.html` is checked by something that survives.

What it asserts, and why each one has bitten before:

  ids unique              five ids exist in two handbooks with different
                          meanings (ROC, IV, IV_RANK, TWAP, VWAP). Keying by
                          the bare id silently dropped one of each pair.
  no rejections           a family that cannot produce its phenomenon on an
                          entry is rejected rather than shipped hollow, so a
                          rejection means a lesson quietly disappeared.
  one correct option      a quiz with two correct answers, or none, cannot be
                          completed — and looks perfectly normal until tried.
  every act step runs     at min, default and max. Most families carry an
                          edge branch that only fires at one end of the slider.
  no NaN in the prose     the grade text interpolates numbers directly, so a
                          NaN renders as the literal word and reads as content.
  seeds not shared        two lessons on the same tape teach the same chart
                          twice while claiming to be different exercises.

Usage:  python3 tools/verify_playground.py
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parent.parent

SWEEP_JS = r"""() => {
  const out = { lessons: 0, rejected: (PG.REJECTED || []).length, ran: 0,
                problems: [], seeds: {}, ids: {} };
  const note = m => { if (out.problems.length < 40) out.problems.push(m); };

  PG.LESSONS.forEach(l => {
    out.lessons++;
    if (out.ids[l.id]) note(`duplicate id ${l.id}`);
    out.ids[l.id] = 1;

    let tape;
    try { tape = PG.Sim.tape(l.tape); }
    catch (e) { note(`${l.id}: tape failed ${e}`); return; }
    if (!tape || tape.n !== l.tape.bars) { note(`${l.id}: tape length`); return; }

    const seed = l.tape.seed;
    (out.seeds[seed] = out.seeds[seed] || []).push(l.id);

    l.steps.forEach((s, ix) => {
      if (s.kind === 'pick') {
        const correct = (s.options || []).filter(o => o.ok).length;
        if (correct !== 1) note(`${l.id} step ${ix}: ${correct} correct options`);
        (s.options || []).forEach((o, oi) => {
          if (!o.label || !o.why) note(`${l.id} step ${ix} option ${oi}: incomplete`);
        });
      }
      if (s.kind !== 'act') return;

      /* min / def / max, because an edge branch is where the untested text is */
      const values = [];
      if (s.param && typeof s.param.def === 'number') {
        [s.param.min, s.param.def, s.param.max].forEach(v => {
          if (typeof v === 'number' && values.indexOf(v) < 0) values.push(v);
        });
      } else {
        values.push(null);
      }

      values.forEach(v => {
        const p = {};
        if (v !== null && s.param) p[s.param.key] = v;
        let res, g;
        try { res = s.run(tape, p, l); }
        catch (e) { note(`${l.id} step ${ix} @${v}: run threw ${e}`); return; }
        try { g = s.grade(res, p, tape, l); }
        catch (e) { note(`${l.id} step ${ix} @${v}: grade threw ${e}`); return; }
        out.ran++;

        if (!g || !g.title || !g.body) { note(`${l.id} step ${ix} @${v}: empty grade`); return; }
        ['zh', 'en'].forEach(lang => {
          const text = g.body[lang];
          if (!text) { note(`${l.id} step ${ix} @${v}: no ${lang} body`); return; }
          if (/NaN|Infinity|undefined|\[object/.test(text)) {
            note(`${l.id} step ${ix} @${v}: ${lang} body contains a non-number`);
          }
        });
      });
    });

    if (!l.close || !l.close.zh || !l.close.en) note(`${l.id}: missing close`);
    if (!l.link) note(`${l.id}: missing handbook link`);
  });

  out.shared = Object.keys(out.seeds).filter(s => out.seeds[s].length > 1)
                     .map(s => `${s}: ${out.seeds[s].join(', ')}`);
  delete out.seeds; delete out.ids;
  return out;
}"""


def main() -> int:
    page_path = REPO / "playground.html"
    if not page_path.exists():
        print(f"ERROR {page_path} not found")
        return 1

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto("file://" + str(page_path))
        page.wait_for_timeout(4000)
        result = page.evaluate(SWEEP_JS)
        browser.close()

    failures = []

    def check(ok: bool, label: str, detail: str = ""):
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}{'  ' + detail if detail else ''}")
        if not ok:
            failures.append(label)

    check(not errors, "no page errors", "" if not errors else errors[0][:120])
    check(result["lessons"] == 305, "305 lessons", str(result["lessons"]))
    check(result["rejected"] == 0, "no rejected lessons", str(result["rejected"]))
    check(result["ran"] >= 600, "act steps executed", f"{result['ran']} runs")
    check(not result["shared"], "no two lessons share a tape seed",
          "" if not result["shared"] else json.dumps(result["shared"][:3]))
    check(not result["problems"], "no content problems",
          "" if not result["problems"] else f"{len(result['problems'])}")

    for problem in result["problems"][:15]:
        print(f"        · {problem}")

    print()
    if failures:
        print(f"FAILED {len(failures)}: {failures}")
        return 1
    print("PLAYGROUND VERIFIED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
