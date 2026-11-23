import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmButton, LABEL, PageHeader, shortDate } from '../components/Bits';
import { useAuth } from '../context/AuthContext';
import { SPORTS } from '../data/landing';
import { createTeam, leaveTeam, myTeams } from '../services/teams';

/** Teams I coach, teams I'm in, and joining or starting one. */
export default function Teams() {
  const { guest } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => myTeams().then(setData).catch(() => setError('Could not load your teams just now.')), []);
  useEffect(() => { load(); }, [load]);

  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const t = await createTeam(name.trim(), sport);
      navigate(`/app/teams/${t.id}`);
    } catch (err) {
      setError(typeof err.detail === 'string' ? err.detail : 'Could not create the team.');
      setBusy(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Teams" title={<>Coach a <em>squad</em></>}>
        Coaches see their whole squad's scores, who is improving and who is at risk, and can set drills. Players join
        with an invite code, and choose to share.
      </PageHeader>
      {error && <div className="mb-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{error}</div>}
      {!data && !error && <p className="text-ink-soft">Loading…</p>}

      {data && (
        <div className="grid lg:grid-cols-2 gap-3">
          <section className="p-7 sm:p-8 rounded-[2rem] bg-stage stage-grid text-white relative overflow-hidden">
            <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-brand/30 blur-3xl" />
            <p className="relative eyebrow mb-2">Teams I coach</p>
            {data.coaching.length === 0 && <p className="relative text-sm text-white/60 mb-4">None yet. Start one below.</p>}
            <div className="relative space-y-2 mb-6">
              {data.coaching.map((t) => {
                const s = SPORTS.find((x) => x.slug === t.sport_slug);
                return (
                  <Link key={t.id} to={`/app/teams/${t.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                    <span>
                      <span className="block font-semibold">{s?.icon} {t.name}</span>
                      <span className="block text-xs text-white/50">{t.players} player{t.players === 1 ? '' : 's'} · code {t.invite_code}</span>
                    </span>
                    <span className="text-sm font-semibold">Open →</span>
                  </Link>
                );
              })}
            </div>
            {guest ? <p className="relative text-sm text-white/60">In the tour you can look at the squad but not change it. Sign in to start your own team.</p> : (
            <form onSubmit={start} className="relative space-y-2">
              <p className={`${LABEL} text-white/50`}>Start a team</p>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Team name, e.g. Under-17 squad"
                aria-label="Team name" className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40" />
              <select value={sport} onChange={(e) => setSport(e.target.value)} aria-label="Team sport"
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm">
                <option value="" className="text-ink">Any sport</option>
                {SPORTS.map((s) => <option key={s.slug} value={s.slug} className="text-ink">{s.name}</option>)}
              </select>
              <button type="submit" disabled={busy || name.trim().length < 2}
                className="w-full px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition disabled:opacity-40">
                Create team
              </button>
            </form>
            )}
          </section>

          <div className="space-y-3">
            <section className="p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
              <p className="eyebrow mb-2">Join your coach's team</p>
              <p className="text-sm text-ink-soft mb-4">Ask your coach for the 8-letter code. You will see exactly what they can see before you agree.</p>
              <form onSubmit={(e) => { e.preventDefault(); navigate(`/app/join/${code.trim().toUpperCase()}`); }} className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={16} placeholder="e.g. K7MP2QXA"
                  aria-label="Invite code" className="flex-1 px-4 py-3 rounded-full border border-line bg-canvas text-sm uppercase tracking-widest" />
                <button type="submit" disabled={code.trim().length < 4} className="px-6 py-3 rounded-full bg-ink text-white text-sm font-semibold disabled:opacity-40">Next</button>
              </form>
            </section>

            <section className="p-7 sm:p-8 rounded-[2rem] bg-sand">
              <p className="eyebrow mb-2">Teams I'm in</p>
              {data.member_of.length === 0 && <p className="text-sm text-ink-soft">You have not joined a team.</p>}
              <div className="space-y-2">
                {data.member_of.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-3xl bg-paper">
                    <span>
                      <span className="block font-semibold">{t.name}</span>
                      <span className="block text-xs text-ink-soft">Coach: {t.coach} · sharing since {shortDate(t.joined_at)}</span>
                    </span>
                    {!guest && (
                      <ConfirmButton label="Leave" question="Stop sharing with this coach?" confirmLabel="Yes, leave"
                        onConfirm={async () => { await leaveTeam(t.id); await load(); }} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
