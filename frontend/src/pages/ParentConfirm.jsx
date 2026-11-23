import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { get, post } from '../services/api';

const KEEPS = [
  'The answers they gave at sign-up: first name, month and year of birth, sport, level, height, weight and any pain or old injuries.',
  'The measurements and scores from each video they analyse. Their videos never leave their phone and are never stored.',
  'Their questions to the in-app coach.',
];
const PROMISES = [
  'Only your child can see this, unless they choose to join their coach\'s team.',
  'An AI writes some explanations; it gets numbers only, never their name, email, exact age, weight or video.',
  'No advertising and no tracking. We never sell anything.',
  'Your child, or you, can download or delete everything at any time.',
];

/** The page a parent reaches from the confirmation email. No sign-in: the private link is the proof. */
export default function ParentConfirm() {
  const { token } = useParams();
  const [info, setInfo] = useState(undefined);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get(`/guardian/${encodeURIComponent(token)}`).then(setInfo).catch((err) => {
      setInfo(null);
      setError(typeof err.detail === 'string' ? err.detail : 'This link could not be opened.');
    });
  }, [token]);

  const answer = async (agree) => {
    setBusy(true);
    try {
      const res = await post(`/guardian/${encodeURIComponent(token)}`, { agree });
      setDone(res.status);
    } catch (err) {
      setError(typeof err.detail === 'string' ? err.detail : 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8"><Logo /></div>

        {info === undefined && !error && <p className="text-ink-soft">Opening…</p>}
        {error && (
          <div className="p-7 rounded-[2rem] bg-paper border border-line">
            <p className="font-display text-xl mb-2">This link does not work</p>
            <p className="text-ink-soft">{error}</p>
          </div>
        )}

        {info && !done && (
          <>
            <section className="p-8 sm:p-10 rounded-[2.2rem] bg-stage stage-grid text-white relative overflow-hidden mb-3">
              <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand/30 blur-3xl" />
              <p className="relative eyebrow mb-3">For a parent or guardian</p>
              <h1 className="relative font-display text-3xl sm:text-[2.4rem] leading-[1.05]">
                {info.child} would like to use <em>SkillLens</em>
              </h1>
              <p className="relative text-white/70 mt-4 leading-relaxed">
                SkillLens gives coaching feedback on {info.sport ? `${info.sport.toLowerCase()} ` : ''}technique from short videos.
                Because {info.child} is under 18, we save nothing about them until you agree.
              </p>
              {info.status === 'confirmed' && <p className="relative mt-4 px-4 py-2 rounded-full bg-mint/20 text-sm inline-block">You have already agreed. You can change your answer below.</p>}
              {info.status === 'declined' && <p className="relative mt-4 px-4 py-2 rounded-full bg-alert/20 text-sm inline-block">You said no earlier. You can change your answer below.</p>}
            </section>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <section className="p-6 rounded-[2rem] bg-paper border border-line">
                <p className="eyebrow mb-3">What we keep</p>
                <ul className="space-y-2 text-sm">{KEEPS.map((k) => <li key={k} className="leading-relaxed">• {k}</li>)}</ul>
              </section>
              <section className="p-6 rounded-[2rem] bg-sand">
                <p className="eyebrow mb-3">Our promises</p>
                <ul className="space-y-2 text-sm">{PROMISES.map((k) => <li key={k} className="leading-relaxed">• {k}</li>)}</ul>
              </section>
            </div>

            <section className="p-7 rounded-[2rem] bg-paper border border-line">
              <p className="text-sm leading-relaxed mb-5">
                SkillLens gives coaching guidance, not medical advice. Please read the full{' '}
                <Link to="/privacy" className="font-semibold underline">Privacy Policy</Link> and{' '}
                <Link to="/terms" className="font-semibold underline">Terms</Link>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => answer(true)}
                  className="px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition disabled:opacity-50">
                  I agree, as {info.child}'s parent or guardian
                </button>
                <button type="button" disabled={busy} onClick={() => answer(false)}
                  className="px-6 py-3 rounded-full border border-line font-semibold disabled:opacity-50">
                  I don't agree
                </button>
              </div>
            </section>
          </>
        )}

        {done && (
          <section className="p-8 rounded-[2rem] bg-paper border border-line">
            <p className="font-display text-2xl mb-2">{done === 'confirmed' ? 'Thank you' : 'Understood'}</p>
            <p className="text-ink-soft leading-relaxed">
              {done === 'confirmed'
                ? `${info.child} can now save their reports. You can ask us to delete everything at any time through the app's Privacy & data page.`
                : `Nothing about ${info.child} will be saved. If you change your mind, open this link again while it is still valid.`}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
