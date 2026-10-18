import type { CalEvent } from '../data/sources';

// UTC timestamps keep exported events stable across DST and calendar clients.
const escape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\;').replace(/,/g, '\\,');
const stamp = (v: string | Date) => new Date(v).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** RFC 5545 folds lines at 75 octets. */
function fold(line: string): string {
  const enc = new TextEncoder();
  let out = '';
  let part = '';
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 75) { out += `${part}\r\n`; part = ' '; bytes = 1; }
    part += ch;
    bytes += n;
  }
  return out + part;
}

export interface IcsItem { event: CalEvent; summary: string; description: string }

export function makeIcs(items: readonly IcsItem[]): string {
  const now = stamp(new Date());
  const body = items.flatMap(({ event, summary, description }) => [
    'BEGIN:VEVENT',
    `UID:${event.id}-${stamp(event.at)}@macro-calendar.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${stamp(event.at)}`,
    `SUMMARY:${escape(summary)}`,
    `DESCRIPTION:${escape(description)}`,
    `URL:${event.url}`,
    'END:VEVENT',
  ]);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Macro Calendar//Release Schedule//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...body, 'END:VCALENDAR'];
  return lines.map(fold).join('\r\n') + '\r\n';
}
