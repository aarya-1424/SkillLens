import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { del, get, post } from '../services/api';

/**
 * For demo accounts only (emails listed in DEMO_EMAILS on the server):
 * fill the account with six weeks of sample history to show people, or
 * remove it again. Nobody else ever sees this card.
 */
export default function DemoTools({ onChange }) {
  const { guest } = useAuth();
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (guest) return;
    get('/me/demo').then(setSt).catch(() => {});
  }, [guest]);

  if (!st?.allowed) return null;

  const run = async (fn, done) => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fn();
      setMsg(done(res));
      setSt(await get('/me/demo'));
      onChange?.();
    } catch {
      setMsg('That did not work. The server may be waking up; try again in a minute.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-3 p-6 rounded-[2rem] border-2 border-dashed border-ink/20 bg-paper no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Demo account</p>
          <p className="font-semibold">
            {st.sample_reports
              ? `${st.sample_reports} sample reports loaded`
              : 'Load six weeks of sample history to show people'}
          </p>
          <p className="text-xs text-ink-soft mt-1 max-w-xl">
            Badminton smash improving over six weeks, plus two squat sessions. Scored by the real engine and
            marked “Sample” in the app. Only you can see this card.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" disabled={busy}
            onClick={() => run(() => post('/me/demo', {}, { timeout: 90_000 }),
              (r) => `Loaded ${r.reports} sample reports${r.coach_answers ? ` and ${r.coach_answers} Ask Coach answers` : ''}.`)}
            className="px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold disabled:opacity-50">
            {busy ? 'Working…' : st.sample_reports ? 'Reload sample data' : 'Fill with sample data'}
          </button>
          {st.sample_reports > 0 && (
            <button type="button" disabled={busy}
              onClick={() => run(() => del('/me/demo'), (r) => `Removed ${r.removed} sample reports.`)}
              className="px-5 py-2.5 rounded-full border border-line text-sm font-semibold text-red-700 disabled:opacity-50">
              Remove sample data
            </button>
          )}
        </div>
      </div>
      {msg && <p className="text-sm mt-3">{msg}</p>}
    </section>
  );
}
