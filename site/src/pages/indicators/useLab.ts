import { useCallback, useState } from 'react';
import { randomSample, sampleFor, type Sample } from './datasets';
import { defaultParams, isChartable } from './fin';

export type Params = Readonly<Record<string, number>>;

export interface LabState {
  ids: readonly string[];
  params: Readonly<Record<string, Params>>;
  sample: Sample;
}

/** One overlay, two oscillators: enough to show both pane kinds on load. */
const START_IDS = ['MA', 'RSI', 'MACD'].filter(isChartable);

function initial(): LabState {
  return {
    ids: START_IDS,
    params: Object.fromEntries(START_IDS.map((id) => [id, defaultParams(id)])),
    sample: sampleFor('cycle'),
  };
}

function without<T>(rec: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));
}

export function useLab() {
  const [state, setState] = useState<LabState>(initial);

  const toggle = useCallback((id: string) => setState((s) => {
    if (s.ids.includes(id)) return { ...s, ids: s.ids.filter((x) => x !== id), params: without(s.params, id) };
    if (!isChartable(id)) return s;
    return { ...s, ids: [...s.ids, id], params: { ...s.params, [id]: defaultParams(id) } };
  }), []);

  const setParam = useCallback((id: string, key: string, value: number) => setState((s) => (
    Number.isFinite(value) && s.params[id]
      ? { ...s, params: { ...s.params, [id]: { ...s.params[id], [key]: value } } }
      : s
  )), []);

  const clear = useCallback(() => setState((s) => ({ ...s, ids: [], params: {} })), []);
  const pickSample = useCallback((id: string) => setState((s) => ({ ...s, sample: sampleFor(id) })), []);
  const randomize = useCallback(() => setState((s) => ({ ...s, sample: randomSample() })), []);

  return { state, toggle, setParam, clear, pickSample, randomize };
}

export type Lab = ReturnType<typeof useLab>;
