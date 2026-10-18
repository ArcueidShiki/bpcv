import { useEffect, useState } from 'react';
import { useLang } from '../../shared/i18n';
import { ActiveList } from './ActiveList';
import { ChartCanvas } from './ChartCanvas';
import { DATASETS, RANDOM_ID } from './datasets';
import { UI, type Family } from './fin';
import { Picker } from './Picker';
import type { Lab } from './useLab';

const NARROW = '(max-width: 520px)';

/** True below the phone breakpoint, tracking resizes. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

/** One panel: toolbar, the combined main + sub chart, the active list, and the
 *  indicator picker beside it (below it on narrow screens). */
export function ChartLab({ lab, family }: { lab: Lab; family: Family | '' }) {
  const { t } = useLang();
  const [zoomKey, setZoomKey] = useState(0);
  const narrow = useNarrow();
  const { state, toggle, setParam, clear, pickSample, randomize } = lab;

  return (
    <div className="panel lab">
      <div className="lab-chart">
        <div className="lab-tools">
          <span className="lab-label">{t(UI.data)}</span>
          <div className="chips">
            {DATASETS.map((d) => (
              <button key={d.id} className={state.sample.id === d.id ? 'chip on' : 'chip'}
                      onClick={() => pickSample(d.id)}>{t(d.label)}</button>
            ))}
            <button className={state.sample.id === RANDOM_ID ? 'chip on' : 'chip'} onClick={randomize}>
              {t(UI.newData)}
            </button>
          </div>
          <span className="lab-spacer" />
          {narrow ? null : (
            <button className="tool" onClick={() => setZoomKey((k) => k + 1)}>{t(UI.resetZoom)}</button>
          )}
          <button className="tool" onClick={clear} disabled={state.ids.length === 0}>{t(UI.clearAll)}</button>
        </div>
        <div className="lab-canvas-wrap">
          <ChartCanvas key={narrow ? 'mini' : 'full'} compact={narrow} zoomKey={zoomKey}
                       ids={state.ids} params={state.params} data={state.sample.data} />
        </div>
        <ActiveList ids={state.ids} params={state.params} onRemove={toggle} onParam={setParam} />
      </div>
      <Picker family={family} ids={state.ids} onToggle={toggle} />
    </div>
  );
}
