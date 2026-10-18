import { useLang } from '../../../shared/i18n';
import { APPLIED } from '../sections';
import { MathSec } from './MathSec';

export function AppliedSection() {
  const { t } = useLang();
  return (
    <MathSec id="applied">
      <div className="m-map">
        {APPLIED.map((r) => (
          <div className="m-map-row" key={r.tool.en}>
            <b>{t(r.tool)}</b><span>{t(r.object)}</span>
          </div>
        ))}
      </div>
    </MathSec>
  );
}
