import { useMemo, useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { drawGbm, drawNorm, normStats, simulateGbm } from '../draw/prob';
import { Lab, Legend, Slider } from '../plot/controls';
import { Plot } from '../plot/Plot';
import { MathSec } from './MathSec';

const SEED0 = 20260821;
const nextSeed = (s: number) => (s * 1103515245 + 12345) >>> 0;

export function ProbSection() {
  const { t } = useLang();
  const [sig, setSig] = useState(45);
  const [days, setDays] = useState(30);
  const [nP, setNP] = useState(40);
  const [seed, setSeed] = useState(SEED0);
  const ns = normStats(sig, days);
  const run = useMemo(() => simulateGbm(nP, sig, days, seed), [nP, sig, days, seed]);
  const med = run.finals[Math.floor(run.finals.length / 2)];
  const normLabels = {
    log: t({ en: 'ln(S_T/S₀): normal', zh: 'ln(S_T/S₀)：正态' }),
    price: t({ en: 'S_T: lognormal, right-skewed', zh: 'S_T：对数正态，右偏' }),
  };
  const shared = <>
    <Slider label={t({ en: 'σ (annual vol)', zh: 'σ（年化波动率）' })} value={sig} out={`${sig}%`} min={5} max={150} step={1} onChange={setSig} />
    <Slider label={t({ en: 'Horizon (days)', zh: '期限（天）' })} value={days} out={String(days)} min={1} max={730} step={1} onChange={setDays} />
  </>;
  return (
    <MathSec id="prob">
      <div className="m-grid2">
        <Lab title={t({ en: 'Normal → lognormal', zh: '正态 → 对数正态' })}
          readout={`±1σ: ${ns.lo.toFixed(1)} – ${ns.hi.toFixed(1)} · ${t({ en: 'exp. move', zh: '预期波动' })} ${ns.move.toFixed(2)}`}
          chart={<>
            <Plot height={240} label={normLabels.price} draw={(cv) => drawNorm(cv, sig, days, normLabels)} />
            {shared}
          </>} />
        <Lab title={t({ en: 'Geometric Brownian motion', zh: '几何布朗运动' })}
          readout={`${t({ en: 'median end', zh: '末端中位数' })} ${med.toFixed(1)} · ${t({ en: 'range', zh: '区间' })} ${run.finals[0].toFixed(0)}–${run.finals[run.finals.length - 1].toFixed(0)}`}
          chart={<>
            <Plot height={240} label={t({ en: 'Simulated price paths', zh: '模拟价格路径' })} draw={(cv) => drawGbm(cv, run, t({ en: 'd', zh: '天' }))} />
            <Legend items={[
              { color: 'var(--c-d2)', label: '±1σ' },
              { color: 'var(--gold)', label: t({ en: 'Median', zh: '中位数' }) },
            ]} />
            <Slider label={t({ en: 'Paths', zh: '路径数' })} value={nP} out={String(nP)} min={5} max={300} step={5} onChange={setNP} />
            <button className="chip m-btn" onClick={() => setSeed(nextSeed(seed))}>{t({ en: 'New random seed', zh: '换一组随机数' })}</button>
          </>} />
      </div>
    </MathSec>
  );
}
