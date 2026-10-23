import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useApp } from './context/App.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Home from './pages/Home.jsx';
import Subjects from './pages/Subjects.jsx';
import SubjectDetail from './pages/SubjectDetail.jsx';
import Tutors from './pages/Tutors.jsx';
import TutorDetail from './pages/TutorDetail.jsx';
import Calendar from './pages/Calendar.jsx';
import Materials from './pages/Materials.jsx';
import { Login, Register } from './pages/Auth.jsx';
import MyLessons from './pages/MyLessons.jsx';
import TutorDashboard from './pages/TutorDashboard.jsx';
// Admin kodi faqat adminlar ochganda yuklanadi (ommaviy sahifa yengil qoladi)
const Admin = lazy(() => import('./pages/admin/index.jsx'));
import Survey from './pages/Survey.jsx';
import { t } from './lib/i18n.js';

function Guard({ role, children }) {
  const { user, ready } = useApp();
  const loc = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // "/#qanday" kabi havolalar: sahifa chizilgach kerakli bo'limga siljiydi
    if (hash) {
      const id = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 150);
      return () => clearTimeout(id);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { ready, lang } = useApp();
  if (!ready) return <Spinner />;
  return (
    <div key={lang}>
      <ScrollTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:id" element={<SubjectDetail />} />
          <Route path="tutors" element={<Tutors />} />
          <Route path="tutors/:id" element={<TutorDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="materials" element={<Materials />} />
          <Route path="survey" element={<Survey />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="my" element={<Guard><MyLessons /></Guard>} />
          <Route path="tutor" element={<Guard><TutorDashboard /></Guard>} />
          <Route path="admin" element={<Guard role="admin"><Suspense fallback={<Spinner />}><Admin /></Suspense></Guard>} />
          <Route path="*" element={<div className="py-20 text-center text-slate-500">{t('Sahifa topilmadi')}</div>} />
        </Route>
      </Routes>
    </div>
  );
}
