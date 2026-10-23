import { useApp } from '../context/App.jsx';
import { t } from '../lib/i18n.js';

/** Fakultet va kurs tanlash — barcha sahifalar shu tanlovga moslashadi */
export default function PrefPicker({ compact = false }) {
  const { meta, pref, savePref } = useApp();
  if (!meta) return null;
  const faculty = pref?.faculty || '';
  const year = pref?.year || '';
  const set = (patch) => savePref({ faculty, year: year || 1, ...patch });
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'sm:gap-3'}`}>
      <select className="input !w-auto min-w-[14rem] flex-1" value={faculty} onChange={(e) => set({ faculty: e.target.value })} aria-label={t('Fakultet')}>
        <option value="" disabled>{t('Fakultetni tanlang')}</option>
        {meta.faculties.map((f) => <option key={f.key} value={f.key}>{t(f.name)}</option>)}
      </select>
      <select className="input !w-auto" value={year} onChange={(e) => set({ year: Number(e.target.value) })} aria-label={t('Kurs')} disabled={!faculty}>
        <option value="" disabled>{t('Kurs')}</option>
        {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{t('{n}-kurs', { n: y })}</option>)}
      </select>
    </div>
  );
}
