import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SPORTS } from '../data/sports';
import { get } from '../services/api';

export default function Dashboard() {
  const { displayName, guest } = useAuth();
  const firstName = (displayName || '').split(' ')[0];
  const [backend, setBackend] = useState('checking');

  useEffect(() => {
    let alive = true;
    get('/health')
      .then(() => alive && setBackend('online'))
      .catch(() => alive && setBackend('offline'));
    return () => { alive = false; };
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Hi{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p className="text-gray-400 mt-1">Ready to check your technique today?</p>
        </div>
        <Link to="/app/analyze" className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-blue-600 hover:scale-105 transition text-center">
          + New analysis
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        <div className="fade-up delay-1 p-6 rounded-2xl bg-gray-900/60 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">Latest score</div>
          <div className="text-4xl font-bold text-gray-500">—</div>
          <div className="text-xs text-gray-500 mt-2">Your first analysis will show here.</div>
        </div>
        <div className="fade-up delay-2 p-6 rounded-2xl bg-gray-900/60 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">Analyses done</div>
          <div className="text-4xl font-bold">0</div>
          <div className="text-xs text-gray-500 mt-2">{guest ? 'Demo mode does not save history.' : 'History saving is coming next.'}</div>
        </div>
        <div className="fade-up delay-3 p-6 rounded-2xl bg-gray-900/60 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">System status</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${backend === 'online' ? 'bg-green-400' : backend === 'offline' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="font-semibold capitalize">Backend {backend}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">Connection to the SkillLens server.</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Pick a sport to start</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {SPORTS.map((s) => (
          <Link key={s.name} to={`/app/analyze?sport=${encodeURIComponent(s.name)}`}
            className="p-5 rounded-2xl bg-gray-900/60 border border-white/10 hover:-translate-y-1 hover:border-teal-400/40 transition">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-semibold">{s.name}</div>
            <div className="text-xs text-gray-400">{s.movement}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
