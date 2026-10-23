import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/App.jsx';
import { PageTitle, Tabs } from '../../components/ui.jsx';
import Overview from './Overview.jsx';
import Research from './Research.jsx';
import Users from './Users.jsx';
import Tutors from './Tutors.jsx';
import Bookings from './Bookings.jsx';
import Finance from './Finance.jsx';
import Reviews from './Reviews.jsx';
import Content from './Content.jsx';
import Messages from './Messages.jsx';
import Settings from './Settings.jsx';
import Audit from './Audit.jsx';
import Guide from './Guide.jsx';

const TABS = [
  ['overview', "Umumiy"], ['users', 'Foydalanuvchilar'], ['tutors', 'Repetitorlar'], ['bookings', 'Bronlar'], ['finance', 'Moliya'], ['reviews', 'Sharhlar'],
  ['content', 'Kontent'], ['messages', 'Xabarlar'], ['research', 'Tadqiqot'], ['settings', 'Sozlamalar'], ['audit', 'Jurnal'], ['guide', "Yo'riqnoma"],
];

export default function Admin() {
  const { user } = useApp();
  const [sp, setSp] = useSearchParams();
  const tab = TABS.some(([k]) => k === sp.get('tab')) ? sp.get('tab') : 'overview';
  const go = (k) => { setSp({ tab: k }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const View = { overview: Overview, users: Users, tutors: Tutors, bookings: Bookings, finance: Finance, reviews: Reviews, content: Content, messages: Messages, research: Research, settings: Settings, audit: Audit, guide: Guide }[tab];

  return (
    <>
      <PageTitle title="Admin panel" sub="Foydalanuvchilar, repetitorlar, bronlar, pul, kontent va sozlamalar — hammasi shu yerda. Birinchi marta kirgan bo'lsangiz, «Yo'riqnoma» bo'limidan boshlang." />
      <Tabs tabs={TABS} value={tab} onChange={go} />
      <View go={go} me={user} />
    </>
  );
}
