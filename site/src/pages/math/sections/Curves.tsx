import { useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { SHAPES, TAY, clampCenter, drawShape, drawTaylor, taylorStats, tayById, termsText, type TayId } from '../draw/curves';
import { Chips, Kpis, Lab, Legend, Slider } from '../plot/controls';
import { Plot } from '../plot/Plot';
import { MathSec } from './MathSec';

const exp = (x: number) => (isFinite(x) ? x.toExponential(2) : '—');

export function ShapesSection() {
  const { t } = useLang();
  return (
    <MathSec id="shapes">
      <div className="m-gal">
        {SHAPES.map((s) => (
          <div className="m-card" key={s.fx}>
            <Plot height={120} label={t(s.n)} draw={(cv) => drawShape(cv, s)} />
            <div className="m-card-b">
              <h4>{t(s.n)}</h4>
              <div className="m-fx">{s.fx}</div>
              <p>{t(s.p)}</p>
            </div>
          </div>
        ))}
      </div>
    </MathSec>
  );
}

export function TaylorSection() {
  const { t } = useLang();
  const [id, setId] = useState<TayId>('exp');
  const [n, setN] = useState(3);
  const [center, setCenter] = useState(0);
  const e = tayById(id);
  const a = clampCenter(id, center);
  const err = taylorStats(e, a, n);
  return (
    <MathSec id="taylor">
      <Lab title={t({ en: 'Truncated expansion vs the true function', zh: '截断展开 vs 真实函数' })}
        readout={`${e.lbl} · n = ${n} · a = ${a.toFixed(1)}`}
        chart={<>
          <Plot height={320} label={e.lbl} draw={(cv) => drawTaylor(cv, e, a, n)} />
          <Legend items={[
            { color: 'var(--c-f)', label: t({ en: 'True function', zh: '真实函数' }) },
            { color: 'var(--c-d2)', label: t({ en: 'Taylor approximation', zh: '泰勒近似' }) },
            { color: 'var(--down)', label: t({ en: '|error|', zh: '|误差|' }) },
          ]} />
        </>}
        side={<>
          <Chips items={TAY.map((x) => ({ id: x.id, label: x.lbl }))} value={id} onPick={setId} />
          <Slider label={t({ en: 'Order n', zh: '阶数 n' })} value={n} out={String(n)} min={0} max={12} step={1} onChange={setN} />
          <Slider label={t({ en: 'Expansion point a', zh: '展开点 a' })} value={center} out={a.toFixed(2)}
            min={-2} max={2} step={0.1} onChange={setCenter} />
          <Kpis items={[
            { k: t({ en: 'error @ a+0.5', zh: '误差 @ a+0.5' }), v: exp(err.near), tone: 'up' },
            { k: t({ en: 'error far away', zh: '远端误差' }), v: exp(err.far), tone: 'dn' },
            { k: t({ en: 'Expansion', zh: '展开式' }), v: termsText(e, a, n), wide: true },
          ]} />
        </>} />
    </MathSec>
  );
}
