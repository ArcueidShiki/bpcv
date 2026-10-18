import { useState } from 'react';
import { useLang } from '../../../shared/i18n';
import { WAVES, drawFourier, drawSpectrum, drawTrig, fourierModel, waveById, type WaveId } from '../draw/waves';
import { Chips, Kpis, Lab, Legend, Slider } from '../plot/controls';
import { Plot } from '../plot/Plot';
import { MathSec } from './MathSec';

const f4 = (x: number) => x.toFixed(4);

export function TrigSection() {
  const { t } = useLang();
  const [th, setTh] = useState(2.827);
  const pi = `${(th / Math.PI).toFixed(2)}π`;
  return (
    <MathSec id="trig">
      <Lab title={t({ en: 'Unit circle → sine and cosine', zh: '单位圆 → 正弦与余弦' })}
        readout={`θ = ${pi} = ${(th * 180 / Math.PI).toFixed(0)}°`}
        chart={<>
          <Plot height={280} label={t({ en: 'Unit circle', zh: '单位圆' })} draw={(cv) => drawTrig(cv, th)} />
          <Legend items={[
            { color: 'var(--c-d1)', label: 'sin θ' }, { color: 'var(--c-d2)', label: 'cos θ' },
            { color: 'var(--c-aux)', label: t({ en: 'Radius', zh: '半径' }) },
          ]} />
        </>}
        side={<>
          <Slider label={t({ en: 'Angle θ', zh: '角度 θ' })} value={th} out={pi} min={0} max={6.2832} step={0.01} onChange={setTh} />
          <Kpis items={[
            { k: 'sin θ', v: f4(Math.sin(th)), tone: 'info' },
            { k: 'cos θ', v: f4(Math.cos(th)), tone: 'acc' },
            { k: 'tan θ', v: Math.abs(Math.cos(th)) < 1e-6 ? '±∞' : f4(Math.tan(th)) },
            { k: 'sin² + cos²', v: f4(Math.sin(th) ** 2 + Math.cos(th) ** 2), tone: 'up' },
          ]} />
        </>} />
    </MathSec>
  );
}

export function FourierSection() {
  const { t } = useLang();
  const [id, setId] = useState<WaveId>('square');
  const [N, setN] = useState(5);
  const w = waveById(id);
  const { used, rms, amps } = fourierModel(w, N);
  return (
    <MathSec id="fourier">
      <Lab title={t({ en: 'Partial sums of a Fourier series', zh: '傅立叶级数的部分和' })} readout={`N = ${N} · RMS ${f4(rms)}`}
        chart={<>
          <Plot height={250} label={t(w.l)} draw={(cv) => drawFourier(cv, w, N)} />
          <Plot height={140} label={t({ en: 'Harmonic amplitudes', zh: '谐波振幅' })} draw={(cv) => drawSpectrum(cv, w, N)} />
          <Legend items={[
            { color: 'var(--text-3)', label: t({ en: 'Target wave', zh: '目标波形' }) },
            { color: 'var(--c-d2)', label: t({ en: 'Partial sum', zh: '部分和' }) },
            { color: 'var(--c-d1)', label: t({ en: 'Harmonic amplitudes', zh: '谐波振幅' }) },
          ]} />
        </>}
        side={<>
          <Chips items={WAVES.map((x) => ({ id: x.id, label: t(x.l) }))} value={id} onPick={setId} />
          <Slider label={t({ en: 'Harmonics N', zh: '谐波数 N' })} value={N} out={String(N)} min={1} max={60} step={1} onChange={setN} />
          <Kpis items={[
            { k: t({ en: 'Non-zero harmonics', zh: '非零谐波' }), v: String(used) },
            { k: t({ en: 'RMS error', zh: 'RMS 误差' }), v: f4(rms), tone: rms < 0.15 ? 'up' : 'dn' },
            { k: t({ en: 'Fundamental amplitude', zh: '基频振幅' }), v: f4(amps[0] ?? 0), wide: true },
          ]} />
        </>} />
    </MathSec>
  );
}
