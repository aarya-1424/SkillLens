import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmButton, LABEL, RiskChip, scoreColour, shortDate } from '../components/Bits';
import { SPORTS } from '../data/landing';
import { useAuth } from '../context/AuthContext';
import {
  assignDrill, closeTeam, getSquad, inviteLink, listDrills, newInviteCode, removeAssignment, teamAssignments,
} from '../services/teams';

const daysAgo = (iso) => (iso ? Math.floor((Date.now() - new Date(iso)) / 86_400_000) : null);

/** A coach's view of one team. */
export default function TeamSquad() {
  const { teamId } = useParams();
  const { guest } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [drills, setDrills] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ drill_id: '', athlete_id: '', note: '', due_date: '' });
  const [sending, setSending] = useState(false);

  const load = useCallback(() => Promise.all([getSquad(teamId), teamAssignments(teamId)])
    .then(([t, a]) => { setTeam(t); setTasks(a); })
    .catch((err) => setError(err.status === 404 ? 'Team not found.' : 'Could not load the team just now.')), [teamId]);

  useEffect(() => { load(); if (!guest) listDrills().then(setDrills).catch(() => {}); }, [load, guest]);

  const sport = SPORTS.find((s) => s.slug === team?.sport_slug);
  const drillOptions = useMemo(() => {
    const own = sport ? drills.filter((d) => d.sport === sport.name) : [];
    const rest = drills.filter((d) => !own.includes(d));
    return [...own, ...rest];
  }, [drills, sport]);

  if (error) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8"><p>{error}</p><Link to="/app/teams" className="underline">Back to teams</Link></main>;
  if (!team) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-ink-soft">Loading…</main>;

  const link = inviteLink(team.invite_code);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await assignDrill(teamId, {
        drill_id: form.drill_id, athlete_id: form.athlete_id || null,
        note: form.note.trim() || null, due_date: form.due_date || null,
      });
      setForm({ drill_id: '', athlete_id: '', note: '', due_date: '' });
      await load();
    } finally {
      setSending(false);
    }
  };

  const active = team.players.filter((p) => p.reports > 0);
  const avg = active.length ? Math.round(active.reduce((s, p) => s + p.latest_total, 0) / active.length) : null;
  const improving = team.players.filter((p) => (p.change_since_last ?? 0) > 0).length;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/app/teams" className="text-sm font-semibold text-ink-soft hover:text-ink">← Teams</Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-4 mb-6">
        <div>
          <p className="eyebrow mb-2">{sport ? `${sport.icon} ${sport.name}` : 'Your team'}</p>
          <h1 className="font-display text-3xl sm:text-[2.6rem] leading-[1.02]">{team.name}</h1>
        </div>
      </div>

      {/* Numbers + invite */}
      <div className="grid lg:grid-cols-12 gap-3 mb-3">
        <section className="lg:col-span-7 p-7 rounded-[2rem] bg-stage stage-grid text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative grid grid-cols-3 gap-3">
            {[['Players', team.players.length], ['Squad average', avg ?? '—'], ['Improving', improving]].map(([k, v]) => (
              <div key={k}>
                <div className={`${LABEL} text-white/50`}>{k}</div>
                <div className="font-display text-3xl mt-2">{v}</div>
              </div>
            ))}
          </div>
          {team.at_risk.length > 0 && (
            <p className="relative mt-6 px-4 py-3 rounded-2xl bg-alert/20 text-sm">
              <strong>Needs attention:</strong> {team.at_risk.join(', ')} (high injury risk or pain that stops training).
            </p>
          )}
        </section>
        <section className="lg:col-span-5 p-7 rounded-[2rem] bg-paper border border-line">
          <p className={`${LABEL} text-ink-soft`}>Invite players</p>
          <p className="font-display text-2xl tracking-widest mt-2">{team.invite_code}</p>
          <p className="text-xs text-ink-soft mt-1 break-all">{link}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button type="button" onClick={copy} className="px-4 py-2 rounded-full bg-ink text-white text-[13px] font-semibold">{copied ? 'Copied' : 'Copy invite link'}</button>
            {!guest && (
              <ConfirmButton label="New code" question="Old code stops working. Sure?" confirmLabel="Make new code"
                className="px-4 py-2 rounded-full border border-line text-[13px] font-semibold"
                onConfirm={async () => { await newInviteCode(teamId); await load(); }} />
            )}
          </div>
          <p className="text-xs text-ink-soft mt-3">Players see exactly what you can see before they agree to join.</p>
        </section>
      </div>

      {/* Squad */}
      <section className="mb-3 p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
        <p className="eyebrow mb-2">Squad</p>
        <h2 className="font-display text-xl sm:text-2xl mb-5">Weakest first, <em>so you know who to help</em></h2>
        {team.players.length === 0 && <p className="text-sm text-ink-soft">No players yet. Share the invite link with your squad.</p>}
        <div className="space-y-2">
          {team.players.map((p) => {
            const idle = daysAgo(p.last_active);
            return (
              <Link key={p.athlete_id} to={`/app/teams/${teamId}/players/${p.athlete_id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-3xl bg-canvas hover:bg-sand transition">
                <span className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-display text-sm text-white tabular-nums"
                    style={{ background: p.latest_total != null ? scoreColour(p.latest_total) : '#625f58' }}>
                    {p.latest_total != null ? Math.round(p.latest_total) : '—'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold truncate">{p.name}</span>
                    <span className="block text-xs text-ink-soft truncate">
                      {[p.age_group, p.level, p.role].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  {p.change_since_last != null && p.change_since_last !== 0 && (
                    <span className={`font-semibold px-3 py-1 rounded-full ${p.change_since_last > 0 ? 'bg-mint/15 text-emerald-800' : 'bg-alert/15 text-red-800'}`}>
                      {p.change_since_last > 0 ? '▲' : '▼'} {Math.abs(p.change_since_last)}
                    </span>
                  )}
                  {p.injury_risk && <RiskChip risk={p.injury_risk} />}
                  {p.sore_areas.length > 0 && <span className="font-semibold px-3 py-1 rounded-full bg-amber/20 text-amber-800">Sore: {p.sore_areas.join(', ')}</span>}
                  <span className="text-ink-soft">{p.reports ? (idle === 0 ? 'Active today' : `Last video ${idle}d ago`) : 'No videos yet'}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Drills */}
      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <section className="p-7 sm:p-8 rounded-[2rem] bg-sand">
          <p className="eyebrow mb-2">Set a drill</p>
          {guest ? (
            <p className="text-sm text-ink-soft">A coach picks a drill from the library of 57, chooses one player or the whole team, adds a note and a due date. The player sees it on their dashboard and ticks it off. In the tour this is look-only.</p>
          ) : (
          <form onSubmit={send} className="space-y-2">
            <select required value={form.drill_id} onChange={(e) => setForm({ ...form, drill_id: e.target.value })} aria-label="Drill"
              className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm">
              <option value="">Choose a drill…</option>
              {drillOptions.map((d) => <option key={d.id} value={d.id}>{d.sport} · {d.name}</option>)}
            </select>
            <select value={form.athlete_id} onChange={(e) => setForm({ ...form, athlete_id: e.target.value })} aria-label="For"
              className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm">
              <option value="">Whole team</option>
              {team.players.map((p) => <option key={p.athlete_id} value={p.athlete_id}>{p.name}</option>)}
            </select>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={300}
              placeholder="Note for the player (optional)" aria-label="Note"
              className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm" />
            <div className="flex gap-2">
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} aria-label="Due date"
                className="flex-1 px-4 py-3 rounded-2xl border border-line bg-paper text-sm" />
              <button type="submit" disabled={sending || !form.drill_id}
                className="px-6 py-3 rounded-full bg-ink text-white text-sm font-semibold disabled:opacity-40">Set drill</button>
            </div>
          </form>
          )}
        </section>
        <section className="p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
          <p className="eyebrow mb-2">Drills set</p>
          {tasks.length === 0 && <p className="text-sm text-ink-soft">None yet.</p>}
          <ul className="divide-y divide-line">
            {tasks.map((t) => (
              <li key={t.id} className="py-3 flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold text-sm">{t.drill?.name}</span>
                  <span className="block text-xs text-ink-soft">
                    For {t.for}{t.due_date ? ` · by ${shortDate(t.due_date)}` : ''} · done by {t.done_count}{t.athlete_id ? '' : ` of ${team.players.length}`}
                  </span>
                  {t.note && <span className="block text-xs mt-0.5">“{t.note}”</span>}
                </span>
                {!guest && (
                  <ConfirmButton label="Remove" question="Remove?" confirmLabel="Yes"
                    onConfirm={async () => { await removeAssignment(teamId, t.id); await load(); }} />
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {!guest && <div className="flex justify-end">
        <ConfirmButton label="Close this team" question="Close it? Players stop sharing with you." confirmLabel="Yes, close"
          onConfirm={async () => { await closeTeam(teamId); navigate('/app/teams', { replace: true }); }} />
      </div>}
    </main>
  );
}
