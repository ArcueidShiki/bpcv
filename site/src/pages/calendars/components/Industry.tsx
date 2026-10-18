import { useLang } from '../../../shared/i18n';
import { Section } from '../../../shared/Layout';

const LINKS: [string, string][] = [
  ['TSMC', 'https://investor.tsmc.com/english/financial-calendar'],
  ['NVDA', 'https://investor.nvidia.com/events-and-presentations/default.aspx'],
  ['AVGO', 'https://investors.broadcom.com/'],
  ['AMD', 'https://ir.amd.com/'],
  ['MU', 'https://investors.micron.com/'],
  ['SNDK', 'https://investor.sandisk.com/'],
  ['SIA', 'https://www.semiconductors.org/'],
  ['DRAMeXchange', 'https://www.dramexchange.com/'],
];

export function Industry() {
  const { t } = useLang();
  return (
    <Section id="industry" title={t({ en: 'Industry watch', zh: '产业追踪' })}>
      <div className="flows">
        <div className="panel">
          <span className="rule-abbr">{t({ en: 'Macro', zh: '宏观' })}</span>
          <div className="flow">NFP → CPI / PPI → PCE → FOMC</div>
          <p className="muted">{t({ en: 'A reading order, not a fixed release order: each surprise reprices the next.', zh: '这是阅读顺序，不是固定发布顺序：每次意外都会重估下一项。' })}</p>
        </div>
        <div className="panel">
          <span className="rule-abbr">{t({ en: 'Chips', zh: '半导体' })}</span>
          <div className="flow">TSMC → {t({ en: 'Earnings', zh: '财报' })} → {t({ en: 'Guidance', zh: '指引' })}</div>
          <p className="muted">{t({ en: 'Monthly revenue and memory prices hint at what earnings will say.', zh: '月度营收和存储价格提前透露财报方向。' })}</p>
        </div>
      </div>
      <div className="links">
        {LINKS.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name} ↗</a>)}
      </div>
    </Section>
  );
}
