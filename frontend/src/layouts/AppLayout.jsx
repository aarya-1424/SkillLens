import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { signOut } from '../services/auth';
import { clearGuestProfile } from '../services/profile';
import { cancelAccountDeletion, getPrivacyStatus } from '../services/privacy';

const SECTIONS = [
  { to: '/app', label: 'Dashboard', short: 'Home', end: true, icon: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z' },
  { to: '/app/reports', label: 'Reports', short: 'Reports', icon: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6' },
  { to: '/app/analyze', label: 'New analysis', short: 'Analyse', primary: true, icon: 'M12 5v14M5 12h14' },
  { to: '/app/progress', label: 'Progress', short: 'Progress', icon: 'M4 19l5-6 4 3 7-9M15 7h5v5' },
  { to: '/app/coach', label: 'Ask Coach', short: 'Coach', icon: 'M5 5h14v10H9l-4 4z' },
];

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const linkClass = ({ isActive }) =>
  `px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition ${isActive ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`;

function AccountMenu({ onSignOut }) {
  const { displayName, avatarUrl, guest, user } = useAuth();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const name = profile?.display_name || displayName || 'You';

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const item = 'block w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-sand transition';
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        aria-label="Your account" className="flex items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 py-1 hover:bg-sand transition">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold">
            {(name || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden sm:inline text-[13px] font-semibold max-w-[8rem] truncate">{name.split(' ')[0]}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 p-2 rounded-3xl bg-paper border border-line shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
          <div className="px-4 py-3">
            <p className="font-semibold truncate">{name}</p>
            <p className="text-xs text-ink-soft truncate">{guest ? 'Demo mode' : user?.email}</p>
          </div>
          <div className="h-px bg-line my-1" />
          <Link role="menuitem" to="/app/setup" className={item}>{profile ? 'Edit profile' : 'Set up profile'}</Link>
          <Link role="menuitem" to="/app/privacy" className={item}>Privacy &amp; data</Link>
          <div className="h-px bg-line my-1" />
          <Link role="menuitem" to="/terms" className={item}>Terms of Service</Link>
          <Link role="menuitem" to="/privacy" className={item}>Privacy Policy</Link>
          <div className="h-px bg-line my-1" />
          <button role="menuitem" type="button" onClick={onSignOut} className={`${item} text-red-700`}>
            {guest ? 'Leave demo' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Shown on every screen while an account deletion is waiting to happen. */
function DeletionBanner() {
  const { guest } = useAuth();
  const [due, setDue] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (guest) return;
    getPrivacyStatus().then((s) => setDue(s.deletion_due_at)).catch(() => {});
  }, [guest]);

  useEffect(() => {
    load();
    window.addEventListener('skilllens:privacy', load);
    return () => window.removeEventListener('skilllens:privacy', load);
  }, [load]);

  if (!due) return null;
  const cancel = async () => {
    setBusy(true);
    try {
      await cancelAccountDeletion();
      setDue(null);
      window.dispatchEvent(new Event('skilllens:privacy'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-sm">
        <span>
          <strong>Your account will be deleted on {new Date(due).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</strong>{' '}
          Changed your mind? You can cancel until then.
        </span>
        <button type="button" onClick={cancel} disabled={busy}
          className="shrink-0 px-4 py-2 rounded-full bg-ink text-white font-semibold disabled:opacity-50">
          Cancel deletion
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { guest, endGuest } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    if (guest) clearGuestProfile();
    endGuest();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="no-print sticky top-4 z-30 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 rounded-full bg-paper/95 backdrop-blur border border-line shadow-[0_12px_40px_-22px_rgba(0,0,0,0.4)] pl-3 pr-2 py-2">
          <Logo to="/app" compact />
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {SECTIONS.map((s) => (
              <NavLink key={s.to} to={s.to} end={s.end} className={linkClass}>{s.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {guest && <span className="hidden sm:inline text-xs font-semibold px-3 py-1 rounded-full bg-amber/20 text-amber-800">Demo mode</span>}
            <AccountMenu onSignOut={handleSignOut} />
          </div>
        </div>
      </header>

      <DeletionBanner />

      <div className="pt-6 pb-28 lg:pb-10">
        <Outlet />
      </div>

      {/* Phones and tablets: the sections live at the bottom, in thumb reach */}
      <nav className="no-print lg:hidden fixed bottom-3 inset-x-3 z-30" aria-label="Main">
        <div className="flex items-end justify-around rounded-[1.75rem] bg-paper/95 backdrop-blur border border-line shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] px-2 py-2">
          {SECTIONS.map((s) => (
            <NavLink key={s.to} to={s.to} end={s.end}
              className={({ isActive }) => (s.primary
                ? 'flex flex-col items-center -mt-6'
                : `flex flex-col items-center gap-1 px-2 py-1 rounded-2xl text-[11px] font-semibold ${isActive ? 'text-ink' : 'text-ink-soft'}`)}>
              {({ isActive }) => (s.primary ? (
                <>
                  <span className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-xl shadow-brand/30 ring-4 ring-canvas">
                    <Icon d={s.icon} className="w-6 h-6" />
                  </span>
                  <span className="text-[11px] font-semibold mt-1 text-ink">{s.short}</span>
                </>
              ) : (
                <>
                  <span className={`w-10 h-7 rounded-full flex items-center justify-center ${isActive ? 'bg-ink text-white' : ''}`}>
                    <Icon d={s.icon} />
                  </span>
                  {s.short}
                </>
              ))}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
