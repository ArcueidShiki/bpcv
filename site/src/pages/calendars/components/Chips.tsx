import { useLang } from '../../../shared/i18n';
import { CATS, type CatId } from '../data/indicators';

/** Category filter; '' means all. */
export function CatChips({ value, onChange }: { value: CatId | ''; onChange: (c: CatId | '') => void }) {
  const { t } = useLang();
  return (
    <div className="chips">
      <button className={value === '' ? 'chip on' : 'chip'} aria-pressed={value === ''} onClick={() => onChange('')}>
        {t({ en: 'All', zh: '全部' })}
      </button>
      {CATS.map((c) => (
        <button key={c.id} className={value === c.id ? 'chip on' : 'chip'} aria-pressed={value === c.id}
                onClick={() => onChange(c.id)}>{t(c.label)}</button>
      ))}
    </div>
  );
}
