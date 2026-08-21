#!/usr/bin/env python3
"""Export the handbook corpus and engine golden values for the native apps.

The iOS app and the PWA must not carry a hand-pasted copy of the content:
the three handbooks keep changing, and a snapshot taken once drifts
silently. This script is the pipeline, and it stamps a hash of each source
file so a stale export is detectable rather than invisible.

It emits two files:

  content.json  one row per encyclopedia entry — prose, formula, and the
                per-line bilingual annotations — keyed by handbook + id,
                because five ids exist in two handbooks with different
                meanings (ROC is Rate of Change in indicators and Return on
                Collateral in options).

  golden.json   reference values read out of the JavaScript engine. The
                Swift port is a transliteration, so these are the numbers
                its tests assert against. Without them the same lesson can
                teach two different things on two platforms.

Usage:  python3 tools/export_pack.py [outdir]
"""
import hashlib
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

REPO = pathlib.Path(__file__).resolve().parent.parent
PAGES = {"indicators.html": "ind", "options.html": "opt", "orders.html": "ord"}
DEFAULT_OUT = pathlib.Path(
    "/Users/arcueidpeng/github/finance/domain-knowledge/apps/shared"
)

# Reference cases for the Swift port. Keep these stable: changing a seed
# invalidates every recorded expectation downstream.
GOLDEN_TAPES = [
    {"name": "gap", "regime": "gap_down", "seed": "golden-gap", "bars": 90,
     "p0": 100.0, "gapAt": 58, "gapPct": -0.061},
    {"name": "trend", "regime": "trend_up", "seed": "golden-trend", "bars": 90, "p0": 100.0},
    {"name": "range", "regime": "range", "seed": "golden-range", "bars": 90, "p0": 100.0},
]


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def export() -> dict:
    content, golden = {}, {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for page_name, src in PAGES.items():
            page = browser.new_page()
            page.goto("file://" + str(REPO / page_name))
            page.wait_for_timeout(2500)
            rows = page.evaluate(
                """(src)=>{
                const doc=FIN.DOC, zh=FIN.FXZH||{}, reg=FIN.REG||{}, out={};
                Object.keys(doc).forEach(id=>{
                  const d=doc[id], a=zh[id]||{};
                  out[src+'.'+id.replace(/[^A-Za-z0-9_]/g,'_')]={
                    src:src, eid:id, cat:d.cat, name:d.full, nameZh:d.nameZh||d.full,
                    tags:d.tags||[], score:d.score||null, formula:d.formula||'',
                    meaning:d.meaning||null, info:d.info||null,
                    notesZh:a.zh||{}, notesEn:a.en||{},
                    params:(reg[id]&&reg[id].params)||null
                  };
                });
                return out;}""",
                src,
            )
            content.update(rows)
            page.close()

        # Golden values are read from the playground, which owns the engine.
        page = browser.new_page()
        page.goto("file://" + str(REPO / "playground.html"))
        page.wait_for_timeout(4000)
        golden = page.evaluate(
            """(tapes)=>{
            const S=PG.Sim, out={tapes:{},engine:{},indicators:{}};
            tapes.forEach(cfg=>{
              const tp=S.tape(cfg);
              out.tapes[cfg.name]={
                seed:cfg.seed,
                first:tp.bars[0].c, mid:tp.bars[45].c, last:tp.bars[tp.n-1].c,
                high:Math.max.apply(null,tp.bars.map(b=>b.h)),
                low:Math.min.apply(null,tp.bars.map(b=>b.l)),
                volMid:tp.bars[45].v
              };
            });
            const gap=S.tape(tapes[0]), t={n:gap.n,bars:gap.bars,seed:gap.seed};
            const gapOpen=gap.bars[58].o;
            const stp=S.ENGINE.STP(t,{side:'sell',qty:2000,stop:98,from:0});
            const above=S.ENGINE.STL(t,{side:'sell',qty:2000,stop:98,limit:97.85,from:0});
            const below=S.ENGINE.STL(t,{side:'sell',qty:2000,stop:98,limit:gapOpen-0.1,from:0});
            /* A limit the tape never revisits after the gap pins the
               "fills nothing" mechanic deterministically; a limit that merely
               sits above the gapped open may still fill if price recovers. */
            let hiAfter=0; for(let i=58;i<gap.n;i++) hiAfter=Math.max(hiAfter,gap.bars[i].h);
            const never=S.ENGINE.STL(t,{side:'sell',qty:2000,stop:98,limit:hiAfter+0.5,from:0});
            const ts=S.ENGINE.TS(t,{side:'sell',qty:2000,trail:2.5,from:0});
            out.engine={
              gapOpen:gapOpen,
              stopFill:stp.px, stopAt:stp.at, stopFilled:stp.filled,
              stlAboveFilled:above.filled,
              stlBelowFilled:below.filled, stlBelowPx:below.px,
              highAfterGap:hiAfter,
              stlNeverLimit:hiAfter+0.5, stlNeverFilled:never.filled,
              trailLevel:ts.level, trailFill:ts.px,
              sweep500:S.sweep(gap.bars[10],'buy',500,gap.seed).px,
              sweep500bps:S.sweep(gap.bars[10],'buy',500,gap.seed).bps,
              sweep20000:S.sweep(gap.bars[10],'buy',20000,gap.seed).px,
              sweep20000bps:S.sweep(gap.bars[10],'buy',20000,gap.seed).bps,
              bsCall:S.bs('C',100,100,30/365,0.04,0.6),
              bsPut:S.bs('P',100,100,30/365,0.04,0.6),
              ncdf1:S.ncdf(1.0)
            };
            const trend=S.tape(tapes[1]), cl=trend.bars.map(b=>b.c);
            const bb=S.IND.boll(cl,20,2), rsi=S.IND.rsi(cl,14), atr=S.IND.atr(trend.bars,14);
            out.indicators={
              sma20_at50:S.IND.sma(cl,20)[50], ema20_at50:S.IND.ema(cl,20)[50],
              bollUp_at50:bb.up[50], bollMid_at50:bb.mid[50], bollDn_at50:bb.dn[50],
              rsi14_at50:rsi[50], atr14_at50:atr[50]
            };
            return out;}""",
            GOLDEN_TAPES,
        )
        page.close()
        browser.close()

    meta = {
        "sources": {name: sha(REPO / name) for name in PAGES},
        "playground": sha(REPO / "playground.html"),
        "entries": len(content),
        "note": "regenerate with tools/export_pack.py whenever a handbook changes",
    }
    return {"meta": meta, "content": content, "golden": golden}


def main() -> int:
    out_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    out_dir.mkdir(parents=True, exist_ok=True)
    data = export()

    (out_dir / "content.json").write_text(
        json.dumps({"meta": data["meta"], "entries": data["content"]},
                   ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (out_dir / "golden.json").write_text(
        json.dumps({"meta": data["meta"], "golden": data["golden"]},
                   ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    counts: dict[str, int] = {}
    for row in data["content"].values():
        counts[row["src"]] = counts.get(row["src"], 0) + 1
    print(f"entries : {data['meta']['entries']}  {counts}")
    for name, digest in data["meta"]["sources"].items():
        print(f"  {name:18s} sha {digest}")
    print(f"written : {out_dir}/content.json, {out_dir}/golden.json")
    missing = [k for k, v in data["content"].items() if not v["formula"]]
    if missing:
        print(f"WARNING entries with no formula: {missing[:5]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
