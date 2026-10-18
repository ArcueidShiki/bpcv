import { useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { MAT_PRESETS, drawMat, drawPortVar, matStats, pvModel, type Mat, type PV } from '../draw/linalg';
import { Chips, Kpis, Lab, Legend, Slider } from '../plot/controls';
import { Plot } from '../plot/Plot';
import { MathSec } from './MathSec';

const CELLS = ['a', 'b', 'c', 'd'] as const;
const num = (v: string) => (isFinite(parseFloat(v)) ? parseFloat(v) : 0);

function MatrixLab() {
  const { t } = useLang();
  const [raw, setRaw] = useState<readonly string[]>(['1.4', '0.6', '0.3', '1.1']);
  const m: Mat = [num(raw[0]), num(raw[1]), num(raw[2]), num(raw[3])];
  const { det, trace, eig } = matStats(m);
  const setCell = (i: number, v: string) => setRaw(raw.map((x, j) => (j === i ? v : x)));
  const preset = MAT_PRESETS.find((p) => p.v.every((v, i) => v === m[i]))?.id ?? null;
  return (
    <Lab title={t({ en: '2×2 transform of the unit square', zh: '单位正方形的 2×2 变换' })} readout={`det ${det.toFixed(3)}`}
      chart={<>
        <Plot height={320} label={t({ en: 'Matrix transform', zh: '矩阵变换' })} draw={(cv) => drawMat(cv, m)} />
        <Legend items={[
          { color: 'var(--text-3)', label: t({ en: 'Before', zh: '变换前' }) },
          { color: 'var(--c-d2)', label: t({ en: 'After A·x', zh: '变换后 A·x' }) },
          { color: 'var(--c-aux)', label: t({ en: 'Eigenvectors', zh: '特征向量' }) },
        ]} />
      </>}
      side={<>
        <div className="m-mat">
          <span>A =</span>
          <span className="m-mat-cells">
            {CELLS.map((c, i) => (
              <input key={c} type="number" step="0.1" aria-label={`A ${c}`} value={raw[i]}
                     onChange={(e) => setCell(i, e.target.value)} />
            ))}
          </span>
        </div>
        <Kpis items={[
          { k: 'det(A)', v: det.toFixed(3), tone: Math.abs(det) < 1e-6 ? 'dn' : det < 0 ? 'gold' : 'up' },
          { k: 'trace(A)', v: trace.toFixed(3) },
          { k: t({ en: 'Eigenvalues', zh: '特征值' }), wide: true,
            v: eig ? `λ = ${eig[0].toFixed(3)}, ${eig[1].toFixed(3)}` : t({ en: 'complex (rotation)', zh: '复数（旋转）' }) },
          { k: t({ en: 'Area change', zh: '面积变化' }), wide: true,
            v: `1.000 → ${Math.abs(det).toFixed(3)}${det < 0 ? t({ en: ' (flipped)', zh: '（翻转）' }) : ''}` },
        ]} />
        <Chips items={MAT_PRESETS.map((p) => ({ id: p.id, label: t(p.l) }))} value={preset}
          onPick={(id) => setRaw((MAT_PRESETS.find((p) => p.id === id)?.v ?? m).map(String))} />
      </>} />
  );
}

function PortVarLab() {
  const { t } = useLang();
  const [pv, setPv] = useState<PV>({ w1: 50, s1: 20, s2: 32, rho: 20 });
  const cur = pvModel(pv).vol(pv.w1 / 100);
  const set = (k: keyof PV) => (v: number) => setPv({ ...pv, [k]: v });
  const pct = (v: number) => `${v}%`;
  return (
    <Lab title={t({ en: 'Two-asset portfolio volatility', zh: '两资产组合波动率' })} readout={`σₚ = ${(cur * 100).toFixed(2)}%`}
      chart={<>
        <Plot height={220} label={t({ en: 'Portfolio volatility', zh: '组合波动率' })} draw={(cv) => drawPortVar(cv, pv)} />
        <Legend items={[
          { color: 'var(--c-d2)', label: t({ en: 'Portfolio σ vs weight w₁', zh: '组合 σ 对权重 w₁' }) },
          { color: 'var(--text-3)', label: t({ en: 'No diversification', zh: '无分散化' }) },
          { color: 'var(--c-aux)', label: t({ en: 'Minimum variance', zh: '最小方差' }) },
        ]} />
      </>}
      side={<>
        <Slider label="w₁" value={pv.w1} out={pct(pv.w1)} min={0} max={100} step={1} onChange={set('w1')} />
        <Slider label="σ₁" value={pv.s1} out={pct(pv.s1)} min={1} max={100} step={1} onChange={set('s1')} />
        <Slider label="σ₂" value={pv.s2} out={pct(pv.s2)} min={1} max={100} step={1} onChange={set('s2')} />
        <Slider label="ρ" value={pv.rho} out={(pv.rho / 100).toFixed(2)} min={-100} max={100} step={1} onChange={set('rho')} />
      </>} />
  );
}

export function LinAlgSection() {
  return (
    <MathSec id="linalg">
      <MatrixLab />
      <PortVarLab />
    </MathSec>
  );
}
