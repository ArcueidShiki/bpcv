import { useLang } from '../../shared/i18n';
import type { Bi } from '../../shared/types';
import { BookAndCharts } from './BookAndCharts';
import { T } from './copy';
import { FIN } from './fin';
import { LabControls, OrderPicker } from './LabControls';
import { LabResult } from './LabResult';
import type { LabState } from './useLab';

/** Pick an order → tune it → watch it run. Charts and book share one session. */
export function OrderLab({ s, names }: { s: LabState; names: Record<string, Bi> }) {
  const { t, lang } = useLang();
  return (
    <div className="lab panel" id="lab">
      <OrderPicker s={s} names={names} />
      <div className="ticket">
        <b>{names[s.id] ? t(names[s.id]) : s.id}</b>
        <code>{FIN.ticket(s.id, s.ctx, lang)}</code>
      </div>
      <BookAndCharts tape={s.tape} ctx={s.ctx} res={s.res} />
      <div className="lab-bottom">
        <LabResult res={s.res} />
        <LabControls s={s} />
      </div>
      <p className="hint">{t(T.simNote)}</p>
    </div>
  );
}
