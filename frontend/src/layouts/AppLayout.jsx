import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`;

export default function AppLayout() {
  const { displayName, avatarUrl, guest, endGuest } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    endGuest();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="no-print sticky top-0 z-20 backdrop-blur bg-gray-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo to="/app" tone="dark" />
          <nav className="flex items-center gap-1">
            <NavLink to="/app" end className={linkClass}>Dashboard</NavLink>
            <NavLink to="/app/analyze" className={linkClass}>New analysis</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {guest && <span className="hidden sm:inline text-xs px-2 py-1 rounded-md bg-yellow-400/10 text-yellow-300">Demo mode</span>}
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center text-sm font-bold">
                {(displayName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <button onClick={handleSignOut} className="text-sm text-gray-400 hover:text-white">Sign out</button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
