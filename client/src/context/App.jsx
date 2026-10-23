import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, getToken, setToken } from '../api.js';
import { getLang, setLang } from '../lib/i18n.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

function sessionId() {
  let sid = read('sid');
  if (!sid) { sid = crypto.randomUUID(); write('sid', sid); }
  return sid;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState(null);
  const [ready, setReady] = useState(false);
  const [pref, setPref] = useState(() => read('pref')); // { faculty, year }
  const { pathname } = useLocation();

  useEffect(() => {
    (async () => {
      try {
        setMeta(await api('/meta'));
        if (getToken()) {
          try { setUser((await api('/auth/me')).user); } catch (e) { if (e.status === 401 || e.status === 403) setToken(null); } // tarmoq yoki 429 xatosi seansni o'chirmasin
        }
      } finally { setReady(true); }
    })();
  }, []);

  // Pilot ko'rsatkichi: tashriflar (anonim sessiya bo'yicha)
  useEffect(() => {
    let ref = '';
    try {
      const p = new URLSearchParams(window.location.search);
      ref = (p.get('ref') || p.get('utm_source') || '').replace(/[^\w.-]/g, '').slice(0, 40);
      if (ref) sessionStorage.setItem('ref', ref); else ref = sessionStorage.getItem('ref') || '';
    } catch { /* private mode */ }
    api('/track', { method: 'POST', body: { sid: sessionId(), path: pathname, ...(ref && { ref }) } }).catch(() => {});
  }, [pathname]);

  const effective = useMemo(() => pref || (user?.faculty ? { faculty: user.faculty, year: user.year } : null), [pref, user]);

  const login = useCallback((token, u) => {
    setToken(token);
    setUser(u);
    if (u.faculty && !read('pref')) { const p = { faculty: u.faculty, year: u.year }; write('pref', p); setPref(p); }
  }, []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);
  const savePref = useCallback(async (p) => {
    write('pref', p); setPref(p);
    if (getToken()) api('/auth/me', { method: 'PATCH', body: p }).then((r) => setUser(r.user)).catch(() => {});
  }, []);

  const [lang, setLangState] = useState(getLang());
  const changeLang = useCallback((l) => { setLang(l); setLangState(l); }, []);

  const value = { user, meta, ready, pref: effective, login, logout, savePref, lang, changeLang };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
