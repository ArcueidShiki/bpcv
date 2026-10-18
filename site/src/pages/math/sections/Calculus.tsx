import { useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { D, drawDeriv, drawRiemann, drawSecant, riemannStats, secantStats } from '../draw/calculus';
import { Kpis, Lab, Legend, Slider } from '../plot/controls';
import { Plot } from '../plot/Plot';
import { MathSec } from './MathSec';

const fmt = (x: number, d = 3) => (isFinite(x) ? x.toFixed(d) : '—');

export function DerivSection() {
  const { t } = useLang();
  const [x0, setX0] = useState(-1.6);
  const [show, setShow] = useState({ d1: true, d2: true, tan: true });
  const s = D.d1(x0), c = D.d2(x0);
  const dir = Math.abs(s) < 0.05 ? t({ en: 'flat', zh: '走平' })
    : s > 0 ? t({ en: 'rising', zh: '上升' }) : t({ en: 'falling', zh: '下降' });
  const bend = Math.abs(c) < 0.05 ? t({ en: 'inflection', zh: '拐点' })
    : c > 0 ? t({ en: 'bends up', zh: '向上弯' }) : t({ en: 'bends down', zh: '向下弯' });
  const labels = { max: t({ en: 'max', zh: '极大' }), min: t({ en: 'min', zh: '极小' }), inflection: t({ en: 'inflection', zh: '拐点' }) };
  const toggles = [
    ['d1', 'f′(x)'], ['d2', 'f″(x)'], ['tan', t({ en: 'Tangent', zh: '切线' })],
  ] as const;

  return (
    <MathSec id="deriv">
      <Lab title="f(x) = x³ − 3x" readout={`x₀ = ${x0.toFixed(2)}`}
        chart={<>
          <Plot height={340} label="f(x) = x³ − 3x"
            draw={(cv) => drawDeriv(cv, { x0, showD1: show.d1, showD2: show.d2, showTan: show.tan }, labels)} />
          <Legend items={[
            { color: 'var(--c-f)', label: 'f(x)' }, { color: 'var(--c-d1)', label: 'f′(x)' },
            { color: 'var(--c-d2)', label: 'f″(x)' }, { color: 'var(--c-aux)', label: t({ en: 'Tangent', zh: '切线' }) },
          ]} />
        </>}
        side={<>
          <Slider label={t({ en: 'Probe point x₀', zh: '探针位置 x₀' })} value={x0} out={x0.toFixed(2)}
            min={-2.2} max={2.2} step={0.01} onChange={setX0} />
          <Kpis items={[
            { k: 'f(x₀)', v: fmt(D.f(x0)) },
            { k: 'f′(x₀)', v: fmt(s), tone: s > 0 ? 'info' : 'dn' },
            { k: 'f″(x₀)', v: fmt(c), tone: 'acc' },
            { k: t({ en: 'Here', zh: '此处' }), v: `${dir} · ${bend}`, wide: true },
          ]} />
          <div className="m-toggles">
            {toggles.map(([k, l]) => (
              <label key={k}>
                <input type="checkbox" checked={show[k]} onChange={(e) => setShow({ ...show, [k]: e.target.checked })} /> {l}
              </label>
            ))}
          </div>
        </>} />
    </MathSec>
  );
}

export function CalcSection() {
  const { t } = useLang();
  const [logH, setLogH] = useState(0);
  const [n, setN] = useState(8);
  const h = Math.pow(10, logH);
  const sec = secantStats(h), rie = riemannStats(n);
  const exact = t({ en: 'exact', zh: '精确' });
  return (
    <MathSec id="calc">
      <div className="m-grid2">
        <Lab title={t({ en: 'Secant → tangent', zh: '割线 → 切线' })}
          readout={`${t({ en: 'secant', zh: '割线' })} ${sec.slope.toFixed(4)} · ${exact} ${sec.exact.toFixed(4)} · |Δ| ${sec.err.toExponential(1)}`}
          chart={<>
            <Plot height={240} label={t({ en: 'Secant → tangent', zh: '割线 → 切线' })} draw={(cv) => drawSecant(cv, h)} />
            <Slider label={t({ en: 'Step h', zh: '步长 h' })} value={logH} out={h < 0.01 ? h.toExponential(1) : h.toFixed(3)}
              min={-3} max={0.15} step={0.01} onChange={setLogH} />
          </>} />
        <Lab title={t({ en: 'Rectangles → area', zh: '矩形 → 面积' })}
          readout={`Σ ${rie.sum.toFixed(6)} · ${exact} ${rie.exact.toFixed(6)} · |Δ| ${rie.err.toExponential(1)}`}
          chart={<>
            <Plot height={240} label={t({ en: 'Rectangles → area', zh: '矩形 → 面积' })} draw={(cv) => drawRiemann(cv, n)} />
            <Slider label={t({ en: 'Rectangles n', zh: '矩形数 n' })} value={n} out={String(n)}
              min={2} max={200} step={1} onChange={setN} />
          </>} />
      </div>
    </MathSec>
  );
}
