import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/Bits';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { joinTeam, previewInvite } from '../services/teams';

const SHARED = [
  'Your name, age group (not your exact age), level and role',
  'Your scores, injury-risk ratings and full reports',
  'Any sore areas you told us about, so they can look after you',
];
const NOT_SHARED = ['Your Ask Coach messages', 'Your email, exact age, height or weight', 'Your videos (we never have them)'];

/** Joining a coach's team: see what they will see, then agree. */
export default function JoinTeam() {
  const { code } = useParams();
  const { guest } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [team, setTeam] = useState(undefined);
  const [agree, setAgree] = useState(false);
  const [parent, setParent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const minor = Boolean(profile?.is_minor);

  useEffect(() => {
    if (guest) return;
    previewInvite(code).then(setTeam).catch((err) => {
      setTeam(null);
      setError(typeof err.detail === 'string' ? err.detail : 'Could not find that team.');
    });
  }, [code, guest]);

  const join = async () => {
    setBusy(true);
    setError('');
    try {
      await joinTeam(code, agree, parent);
      navigate('/app/teams', { replace: true });
    } catch (err) {
      setError(typeof err.detail === 'string' ? err.detail : 'Could not join just now.');
      setBusy(false);
    }
  };

  if (guest) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader eyebrow="Join a team" title={<>Sign in <em>first</em></>}>Joining a team needs an account, so your coach can see your saved reports.</PageHeader>
        <Link to="/login" className="px-6 py-3 rounded-full bg-brand text-white font-semibold">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Join a team" title={team ? <>Join <em>{team.name}</em></> : <>Join a <em>team</em></>}>
        {team && <>Coach: <strong className="text-ink">{team.coach}</strong>{team.sport ? ` · ${team.sport}` : ''} · {team.players} player{team.players === 1 ? '' : 's'} so far</>}
      </PageHeader>

      {error && <div className="mb-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{error}</div>}
      {team === undefined && !error && <p className="text-ink-soft">Checking the code…</p>}

      {team && (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <section className="p-6 rounded-[2rem] bg-paper border border-line">
              <p className="eyebrow mb-3">Your coach will see</p>
              <ul className="space-y-2 text-sm">
                {SHARED.map((s) => <li key={s} className="flex gap-2"><span aria-hidden="true">✓</span>{s}</li>)}
              </ul>
            </section>
            <section className="p-6 rounded-[2rem] bg-sand">
              <p className="eyebrow mb-3">Never shared</p>
              <ul className="space-y-2 text-sm text-ink-soft">
                {NOT_SHARED.map((s) => <li key={s} className="flex gap-2"><span aria-hidden="true">✕</span>{s}</li>)}
              </ul>
            </section>
          </div>

          <section className="p-7 rounded-[2rem] bg-paper border border-line space-y-4">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#d7282f]"
                aria-label="I agree to share with this coach" />
              <span>I agree to share the information above with this coach. I can leave the team at any time, and they will stop seeing it straight away.</span>
            </label>
            {minor && (
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input type="checkbox" checked={parent} onChange={(e) => setParent(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#d7282f]"
                  aria-label="My parent or guardian agrees" />
                <span>I am under 18, and my parent or guardian has agreed that I can share this with my coach.</span>
              </label>
            )}
            <p className="text-xs text-ink-soft">See section 5 of our <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={join} disabled={busy || !agree || (minor && !parent)}
                className="px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition disabled:opacity-40">
                {busy ? 'Joining…' : 'Join the team'}
              </button>
              <Link to="/app/teams" className="px-6 py-3 rounded-full border border-line font-semibold">Not now</Link>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
