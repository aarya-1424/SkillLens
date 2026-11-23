import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { post } from '../services/api';

/** For under-18s whose parent has not confirmed by email yet. Shown on every screen. */
export default function GuardianBanner() {
  const { profile, reload } = useProfile();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const status = profile?.guardian_status;
  if (status !== 'pending' && status !== 'declined') return null;
  if (!profile.guardian_email_enabled) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 no-print">
        <p className="px-5 py-3 rounded-3xl glass text-sm">
          <strong>Coming soon:</strong> we will email your parent or guardian a link to confirm. For now, the agreement you gave at sign-up is recorded.
        </p>
      </div>
    );
  }

  const resend = async () => {
    setBusy(true);
    setMsg('');
    try {
      const r = await post('/me/guardian/resend', {});
      setMsg(r.sent ? `Sent to ${r.to}. Ask them to check their inbox (and spam).` : 'We could not send the email right now. Please try again later.');
      reload();
    } catch (err) {
      setMsg(typeof err.detail === 'string' ? err.detail : 'Could not send just now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 no-print">
      <div className="px-5 py-4 rounded-3xl bg-amber/15 border border-amber/40 text-sm">
        <p>
          {status === 'declined'
            ? <><strong>Your parent or guardian did not agree.</strong> Nothing is being saved. Talk to them, then send the email again.</>
            : profile.guardian_email_sent
              ? <><strong>Waiting for your parent or guardian.</strong> We emailed {profile.guardian_email_hint} a link to confirm. Until they do, you can try the app, but nothing is saved.</>
              : <><strong>We still need your parent or guardian to confirm.</strong> Send them the email so your reports can be saved.</>}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button type="button" onClick={resend} disabled={busy} className="px-4 py-2 rounded-full bg-ink text-white text-[13px] font-semibold disabled:opacity-50">
            {profile.guardian_email_sent ? 'Send again' : 'Send the email'}
          </button>
          <Link to="/app/setup?step=4" className="px-4 py-2 rounded-full border border-line bg-paper text-[13px] font-semibold">Change their email</Link>
          {msg && <span className="text-xs">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
