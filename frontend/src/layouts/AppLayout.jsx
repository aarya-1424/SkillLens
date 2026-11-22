import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import { clearGuestProfile } from '../services/profile';

const linkClass = ({ isActive }) =>
  `px-3 sm:px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition ${isActive ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`;

export default function AppLayout() {
  const { displayName, avatarUrl, guest, endGuest } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    if (guest) clearGuestProfile();
    endGuest();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="no-print sticky top-4 z-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 rounded-full bg-paper/95 backdrop-blur border border-line shadow-[0_12px_40px_-22px_rgba(0,0,0,0.4)] pl-3 pr-2 py-2">
          <Logo to="/app" compact />
          <nav className="flex items-center gap-1">
            <NavLink to="/app" end className={linkClass}>Dashboard</NavLink>
            <NavLink to="/app/analyze" className={linkClass}>New analysis</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {guest && <span className="hidden sm:inline text-xs font-medium px-3 py-1 rounded-full bg-amber/20 text-amber-800">Demo mode</span>}
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-sm font-bold">
                {(displayName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={handleSignOut} className="hidden sm:block text-[13px] font-medium text-ink-soft hover:text-ink pr-3">Sign out</button>
          </div>
        </div>
      </header>
      <div className="pt-6">
        <Outlet />
      </div>
    </div>
  );
}
