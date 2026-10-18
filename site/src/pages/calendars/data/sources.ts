import type { Bi } from '../../../shared/types';
import eventsJson from './events.json';
import historyJson from './history.json';
import impactsJson from './impacts.json';
import type { Profile } from './indicators';

/** One verified, scheduled release (official calendars, checked 2026-09-12). */
export interface CalEvent { id: string; at: string; period: Bi; url: string }

export type Freq = 'M' | 'Q' | 'W';
export type Transform = 'level' | 'pct' | 'diff' | 'annual';

/** One official series (via FRED), seasonally adjusted, latest revised values. */
export interface Series {
  id: string;
  group: string;
  name: Bi;
  freq: Freq;
  transform: Transform;
  unit: string;
  agency: string;
  url: string;
  points: readonly (readonly [string, number | null])[];
}

/** Four markets, in order: economy, equities, Treasuries, oil. */
export interface Impact { high: readonly Bi[]; low: readonly Bi[] }

export const EVENTS: readonly CalEvent[] = eventsJson;

// JSON widens tuples and string unions; the files are generated from the
// official snapshot by a script, so the narrowing below is safe.
export const HISTORY = historyJson as unknown as { retrievedAt: string; series: readonly Series[] };

export const IMPACTS = impactsJson as Record<Profile, Impact>;

export const VERIFIED = '2026-09-12';
