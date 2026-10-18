import { useMemo } from 'react';
import { useLang } from '../../shared/i18n';
import { analyse, buildPosition, FIN, hasTwoExpiries, positionGreeks, type Bias, type Market } from './fin';
import { PayoffPanel } from './PayoffPanel';
import { Readout } from './Readout';
import { Sliders } from './Sliders';
import { BIAS_LABEL, stratName } from './strategies';

const idsFor = (b: Bias) => Object.keys(FIN.STRAT).filter((id) => FIN.STRAT[id].bias === b);

/** Pick a structure → payoff at expiry and today, greeks, what-if sliders. */
export function Lab({ id, onPick, m, onMarket }: {
  id: string; onPick: (id: string) => void; m: Market; onMarket: (m: Market) => void;
}) {
  const { t, lang } = useLang();
  const bias = FIN.STRAT[id]?.bias ?? 'bullish';
  const pos = useMemo(() => buildPosition(id, m), [id, m]);
  const an = useMemo(() => (pos ? analyse(pos, m.S) : null), [pos, m.S]);
  const greeks = useMemo(() => (pos ? positionGreeks(pos, m.S) : null), [pos, m.S]);

  return (
    <div className="lab panel">
      <div className="lab-pick">
        <div className="tabs" role="tablist">
          {FIN.BIASES.map((b) => (
            <button key={b} role="tab" aria-selected={b === bias} className={b === bias ? 'tab on' : 'tab'}
                    onClick={() => onPick(idsFor(b)[0])}>{t(BIAS_LABEL[b])}</button>
          ))}
        </div>
        <div className="chips">
          {idsFor(bias).map((s) => (
            <button key={s} data-id={s} className={s === id ? 'chip on' : 'chip'} onClick={() => onPick(s)}>
              {t(stratName(s))}
            </button>
          ))}
        </div>
      </div>
      {pos && an && greeks ? (
        <div className="lab-body">
          <div className="lab-chart">
            <div className="lab-title">
              <b>{t(stratName(id))}</b>
              <span className="ticket">{FIN.ticket(pos, lang)}</span>
            </div>
            <PayoffPanel pos={pos} an={an} S={m.S} />
          </div>
          <aside className="lab-side">
            <Sliders m={m} onChange={onMarket} />
            <Readout an={an} greeks={greeks} twoExp={hasTwoExpiries(pos)} />
          </aside>
        </div>
      ) : (
        <p className="muted">{t({ en: 'Unknown strategy.', zh: '未知策略。' })}</p>
      )}
    </div>
  );
}
