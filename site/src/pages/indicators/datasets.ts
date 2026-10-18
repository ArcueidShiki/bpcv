import type { Bi } from '../../shared/types';
import { FIN, type OHLCV } from './fin';

/** Seeded synthetic OHLCV. Each preset runs the engine's regime schedule
 *  (rally, top, decline, base, new advance) over a different random path. */
export interface Dataset { id: string; label: Bi; seed: number; bars: number }

export const DATASETS: readonly Dataset[] = [
  { id: 'cycle', label: { en: 'Full cycle', zh: '完整周期' }, seed: 20260725, bars: 400 },
  { id: 'alt', label: { en: 'Another path', zh: '另一路径' }, seed: 1337, bars: 400 },
  { id: 'short', label: { en: 'Short window', zh: '短周期' }, seed: 42, bars: 160 },
];

export const RANDOM_ID = 'random';
const RANDOM_BARS = 400;

export interface Sample { id: string; data: OHLCV }

export function sampleFor(id: string): Sample {
  const preset = DATASETS.find((d) => d.id === id) ?? DATASETS[0];
  return { id: preset.id, data: FIN.genOHLCV(preset.bars, preset.seed) };
}

export function randomSample(): Sample {
  const seed = Math.floor(Math.random() * 2147483647);
  return { id: RANDOM_ID, data: FIN.genOHLCV(RANDOM_BARS, seed) };
}
