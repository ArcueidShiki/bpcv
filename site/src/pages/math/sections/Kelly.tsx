import { useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { drawKelly, drawKellyPaths, kellyModel } from '../draw/kelly';
import { Kpis, Lab, Legend, Slider } from '../plot/controls';
import { Plot } from '../plot/Plot';
import { MathSec } from './MathSec';

export function KellySection() {
  const { t } = useLang();
  const [p, setP] = useState(55);
  const [b, setB] = useState(1);
  const [f, setF] = useState(10);
  const k = { p: p / 100, b, f: f / 100 };
  const { fStar, edge, gf } = kellyModel(k);
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const verdict = edge <= 0 ? t({ en: 'No edge: do not bet', zh: '无优势：不该下注' })
    : k.f > fStar ? t({ en: 'Past f*: growth is falling', zh: '超过 f*：增长率在下降' })
    : k.f > fStar * 0.55 ? t({ en: 'Near f*: aggressive', zh: '接近 f*：偏激进' })
    : t({ en: 'Below f*: conservative', zh: '低于 f*：保守' });
  return (
    <MathSec id="kelly">
      <Lab title={t({ en: 'Long-run growth vs bet fraction', zh: '长期增长率 vs 下注比例' })}
        readout={`f* = ${fStar > 0 ? pct(fStar) : '—'}`}
        chart={<>
          <Plot height={280} label={t({ en: 'Growth rate g(f)', zh: '增长率 g(f)' })} draw={(cv) => drawKelly(cv, k)} />
          <Plot height={190} label={t({ en: 'Simulated wealth paths', zh: '模拟财富路径' })} draw={(cv) => drawKellyPaths(cv, k)} />
          <Legend items={[
            { color: 'var(--c-d2)', label: t({ en: 'Log growth g(f)', zh: '对数增长 g(f)' }) },
            { color: 'var(--c-aux)', label: t({ en: 'Full Kelly f*', zh: '完整凯利 f*' }) },
            { color: 'var(--c-d1)', label: t({ en: 'Half Kelly', zh: '半凯利' }) },
            { color: 'var(--text-2)', label: t({ en: 'Wealth paths (log)', zh: '财富路径（对数）' }) },
          ]} />
        </>}
        side={<>
          <Slider label={t({ en: 'Win probability p', zh: '胜率 p' })} value={p} out={`${p}%`} min={1} max={99} step={1} onChange={setP} />
          <Slider label={t({ en: 'Win / loss ratio b', zh: '盈亏比 b' })} value={b} out={b.toFixed(2)} min={0.2} max={5} step={0.05} onChange={setB} />
          <Slider label={t({ en: 'Your bet fraction f', zh: '你的下注比例 f' })} value={f} out={`${f}%`} min={0} max={100} step={1} onChange={setF} />
          <Kpis items={[
            { k: 'f*', v: fStar > 0 ? pct(fStar) : '—', tone: fStar > 0 ? 'up' : 'dn' },
            { k: t({ en: 'Edge pb − q', zh: '优势 pb − q' }), v: edge.toFixed(3), tone: edge > 0 ? 'up' : 'dn' },
            { k: 'g(f)', v: isFinite(gf) ? gf.toFixed(4) : '−∞', tone: gf > 0 ? 'up' : 'dn' },
            { k: t({ en: 'Half Kelly', zh: '半凯利' }), v: fStar > 0 ? pct(fStar / 2) : '—', tone: 'info' },
            { k: t({ en: 'Verdict', zh: '判断' }), v: verdict, wide: true },
          ]} />
        </>} />
    </MathSec>
  );
}
