import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmButton, LABEL, PageHeader, dateTime, shortDate } from '../components/Bits';
import { useAuth } from '../context/AuthContext';
import { DELETION_GRACE_DAYS, POLICY_LABEL, RESPONSE_DAYS } from '../data/legal';
import { clearGuestProfile } from '../services/profile';
import {
  announcePrivacyChange, cancelAccountDeletion, clearCoachHistory, downloadMyData, getPrivacyStatus,
  requestAccountDeletion, sendPrivacyRequest, setAiPaused,
} from '../services/privacy';

const REQUEST_KINDS = [
  { key: 'grievance', label: 'Raise a privacy complaint' },
  { key: 'correction', label: 'Correct my data' },
  { key: 'question', label: 'Ask about my data' },
  { key: 'nominate', label: 'Nominate someone to act for me' },
  { key: 'guardian', label: 'Request from a parent or guardian' },
];

function Card({ title, eyebrow, children, tone = 'paper', wide = false }) {
  const look = tone === 'sand' ? 'bg-sand' : tone === 'alert' ? 'bg-alert/5 border border-alert/25' : 'bg-paper border border-line';
  return (
    <section className={`p-7 sm:p-8 rounded-[2rem] ${look} ${wide ? 'lg:col-span-2' : ''}`}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="font-display text-lg sm:text-xl mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Switch({ on, onChange, label, busy }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={busy} onClick={() => onChange(!on)}
      className={`relative w-14 h-8 rounded-full transition shrink-0 ${on ? 'bg-ink' : 'bg-sand-deep'} disabled:opacity-50`}>
      <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function GuestPrivacy() {
  const [cleared, setCleared] = useState(false);
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Privacy & data" title={<>The tour keeps <em>nothing</em></>}>
        In the tour nothing about you is saved on our servers. Your setup answers, if you filled them in, are kept only in
        this browser.
      </PageHeader>
      <div className="grid gap-3">
        <Card title="Clear my tour data">
          <p className="text-sm text-ink-soft mb-4">Removes any setup answers you changed in the tour from this browser.</p>
          {cleared
            ? <p className="text-sm font-semibold text-emerald-700">Done. Nothing from your tour is left in this browser.</p>
            : <ConfirmButton label="Clear tour data" question="Clear it now?" confirmLabel="Yes, clear"
                onConfirm={async () => { clearGuestProfile(); setCleared(true); }} />}
        </Card>
        <Card title="Read how we handle information" tone="sand">
          <div className="flex flex-wrap gap-2">
            <Link to="/privacy" className="px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold">Privacy Policy</Link>
            <Link to="/terms" className="px-5 py-2.5 rounded-full border border-line bg-paper text-sm font-semibold">Terms of Service</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function PrivacyCenter() {
  const { guest } = useAuth();
  const [st, setSt] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [kind, setKind] = useState('grievance');
  const [details, setDetails] = useState('');
  const [deleteChecked, setDeleteChecked] = useState(false);

  const load = useCallback(() => getPrivacyStatus().then(setSt).catch(() => setError('Could not load your privacy settings just now.')), []);
  useEffect(() => { if (!guest) load(); }, [guest, load]);

  if (guest) return <GuestPrivacy />;

  const act = async (key, fn, message) => {
    setBusy(key);
    setError('');
    setNotice('');
    try {
      const res = await fn();
      setNotice(message || res?.message || 'Done.');
      await load();
      announcePrivacyChange();
      return true;
    } catch (err) {
      setError(typeof err.detail === 'string' ? err.detail : 'That did not work. Please try again.');
      return false;
    } finally {
      setBusy('');
    }
  };

  const submitRequest = (e) => {
    e.preventDefault();
    act('request', () => sendPrivacyRequest(kind, details.trim())).then((ok) => ok && setDetails(''));
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Privacy & data" title={<>You are in <em>control</em></>}>
        Every right in our <Link to="/privacy" className="font-semibold underline text-ink">Privacy Policy</Link> is a button
        on this page. Everything you do here is recorded in your privacy log below.
      </PageHeader>

      {notice && <div className="mb-3 px-5 py-3 rounded-3xl bg-mint/15 border border-mint/40 text-sm">{notice}</div>}
      {error && <div className="mb-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{error}</div>}
      {!st && !error && <p className="text-ink-soft">Loading…</p>}

      {st && (
        <div className="grid lg:grid-cols-2 gap-3">
          {/* What we hold */}
          <section className="lg:col-span-2 relative overflow-hidden p-7 sm:p-9 rounded-[2.2rem] bg-stage stage-grid text-white">
            <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-brand/30 blur-3xl" />
            <p className="relative eyebrow mb-3">What we hold about you</p>
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Saved reports', st.holdings.reports],
                ['Ask Coach messages', st.holdings.coach_messages],
                ['Setup answers', st.holdings.profile_answers ? 'Yes' : 'None'],
                ['Videos', 'Never stored'],
              ].map(([k, v]) => (
                <div key={k} className="p-5 rounded-3xl bg-white/5 border border-white/10">
                  <div className={`${LABEL} text-white/50`}>{k}</div>
                  <div className="font-display text-xl mt-2">{v}</div>
                </div>
              ))}
            </div>
            <div className="relative flex flex-wrap items-center gap-3 mt-6">
              <button type="button" disabled={busy === 'export'}
                onClick={() => act('export', downloadMyData, 'Your data has been downloaded to this device.')}
                className="px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition disabled:opacity-50">
                {busy === 'export' ? 'Preparing…' : 'Download my data'}
              </button>
              <span className="text-xs text-white/50">One file with everything: account, setup answers, reports, Ask Coach and this log.</span>
            </div>
          </section>

          {/* AI switch */}
          <Card eyebrow="Consent" title="AI features">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-ink-soft leading-relaxed">
                When on, report summaries and Ask Coach answers are written by an AI model (Groq, in the United States).
                It gets your report's numbers, your question, and your age group, level, goal and sore areas. Never your
                name, email, photo, exact age, weight or video.
              </p>
              <Switch on={!st.ai_paused} busy={busy === 'ai'} label="AI features"
                onChange={(on) => act('ai', () => setAiPaused(!on), on ? 'AI features are on.' : 'AI features are off. Nothing is sent to the AI model.')} />
            </div>
            <p className="text-sm font-semibold mt-4">{st.ai_paused ? 'Off: nothing is sent to the AI model.' : 'On'}</p>
          </Card>

          {/* Consent record */}
          <Card eyebrow="Consent" title="What you agreed to">
            <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
              <dt className="text-ink-soft">Version</dt>
              <dd className="font-semibold">{st.accepted_version ? `${POLICY_LABEL} (${st.accepted_version})` : 'Not yet'}</dd>
              <dt className="text-ink-soft">Agreed on</dt>
              <dd className="font-semibold">{st.accepted_at ? dateTime(st.accepted_at) : '—'}</dd>
              {st.guardian_consent_at && (
                <>
                  <dt className="text-ink-soft">Parent / guardian</dt>
                  <dd className="font-semibold">Agreed {dateTime(st.guardian_consent_at)}</dd>
                </>
              )}
            </dl>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link to="/terms" className="px-4 py-2 rounded-full border border-line text-[13px] font-semibold hover:border-ink/40">Terms</Link>
              <Link to="/privacy" className="px-4 py-2 rounded-full border border-line text-[13px] font-semibold hover:border-ink/40">Privacy Policy</Link>
              <Link to="/app/setup" className="px-4 py-2 rounded-full bg-ink text-white text-[13px] font-semibold">Correct my answers</Link>
            </div>
          </Card>

          {/* Delete things */}
          <Card eyebrow="Erasure" title="Delete things">
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-ink-soft">Delete one report at a time</span>
                <Link to="/app/reports" className="px-4 py-2 rounded-full border border-line text-[13px] font-semibold hover:border-ink/40">Go to my reports</Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-ink-soft">Clear all Ask Coach messages ({st.holdings.coach_messages})</span>
                <ConfirmButton label="Clear history" question="Clear them all?" confirmLabel="Yes, clear"
                  onConfirm={() => act('chat', clearCoachHistory, 'Your Ask Coach history has been cleared.')} />
              </div>
            </div>
          </Card>

          {/* Delete account */}
          <Card eyebrow="Erasure" title="Delete my account" tone="alert">
            {st.deletion_due_at ? (
              <>
                <p className="text-sm leading-relaxed">
                  Your account will be permanently deleted on <strong>{shortDate(st.deletion_due_at)}</strong>. Until then
                  you can change your mind.
                </p>
                <button type="button" disabled={busy === 'cancel'}
                  onClick={() => act('cancel', cancelAccountDeletion)}
                  className="mt-4 px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold disabled:opacity-50">
                  Cancel deletion
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Deletes your account, setup answers, reports and Ask Coach messages. You get {DELETION_GRACE_DAYS} days
                  to change your mind; after that it is permanent. This also withdraws all your consent.
                </p>
                <label className="flex items-start gap-3 mt-4 text-sm cursor-pointer">
                  <input type="checkbox" checked={deleteChecked} onChange={(e) => setDeleteChecked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[#d7282f]" aria-label="I understand my account will be deleted" />
                  <span>I understand everything will be deleted after {DELETION_GRACE_DAYS} days.</span>
                </label>
                <button type="button" disabled={!deleteChecked || busy === 'delete'}
                  onClick={() => act('delete', requestAccountDeletion)}
                  className="mt-4 px-5 py-2.5 rounded-full bg-alert text-white text-sm font-semibold disabled:opacity-40">
                  Delete my account
                </button>
              </>
            )}
          </Card>

          {/* Requests and complaints */}
          <Card eyebrow="Grievance" title="Ask us, or complain" tone="sand" wide>
            <form onSubmit={submitRequest} className="space-y-3">
              <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="What kind of request"
                className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm">
                {REQUEST_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={2000}
                aria-label="Details" placeholder="Tell us what you need, in your own words."
                className="w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-ink-soft">Our Grievance Officer replies within {RESPONSE_DAYS} days. The reply appears in your log below.</span>
                <button type="submit" disabled={details.trim().length < 10 || busy === 'request'}
                  className="px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold disabled:opacity-40">
                  Send
                </button>
              </div>
            </form>
          </Card>

          {/* The log */}
          <section className="lg:col-span-2 p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
            <p className="eyebrow mb-2">Privacy log</p>
            <h2 className="font-display text-lg sm:text-xl mb-4">Everything you have done here</h2>
            {!st.history.length && <p className="text-sm text-ink-soft">Nothing yet.</p>}
            <ul className="divide-y divide-line">
              {st.history.map((h) => (
                <li key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{h.label}</p>
                    {h.details && <p className="text-sm text-ink-soft mt-0.5">{h.details}</p>}
                    {h.resolution && <p className="text-sm mt-1"><strong>Our reply:</strong> {h.resolution}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {h.status === 'open' && <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-amber/20 text-amber-800">Reply by {shortDate(h.due_by)}</span>}
                    {h.status === 'resolved' && <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-mint/15 text-emerald-800">Answered</span>}
                    <span className="text-xs text-ink-soft">{dateTime(h.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
