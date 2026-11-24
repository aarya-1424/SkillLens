import { useState } from 'react';
import { Link } from 'react-router-dom';

export const LABEL = 'text-[11px] font-bold tracking-[0.18em] uppercase';

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const dateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const RISK = {
  Low: 'bg-mint/15 text-emerald-800',
  Medium: 'bg-amber/20 text-amber-800',
  High: 'bg-alert/15 text-red-800',
};

const RISK_ON_DARK = {
  Low: 'bg-mint/20 text-mint',
  Medium: 'bg-amber/20 text-amber',
  High: 'bg-alert/20 text-alert',
};

export function RiskChip({ risk, suffix = ' risk', dark = false }) {
  const tone = (dark ? RISK_ON_DARK : RISK)[risk] || 'bg-sand';
  return (
    <span className={`shrink-0 font-semibold rounded-full ${dark ? 'inline-block px-4 py-1.5 font-display text-sm' : 'text-[11px] px-3 py-1'} ${tone}`}>
      {risk}{suffix}
    </span>
  );
}

export const scoreColour = (v) => (v >= 85 ? '#10b981' : v >= 50 ? '#f59e0b' : '#f04438');

/** The round score. `dark` for use on the black stage blocks. */
export function ScoreRing({ value, size = 'w-36 h-36', dark = true }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className={`relative ${size} shrink-0`}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.12)' : '#e9e6de'} strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={scoreColour(value)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl leading-none">{Math.round(value)}</span>
        <span className={`text-[10px] tracking-[0.18em] uppercase mt-1 ${dark ? 'text-white/50' : 'text-ink-soft'}`}>of 100</span>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, action }) {
  return (
    <div className="fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-3xl sm:text-[2.6rem] leading-[1.02]">{title}</h1>
        {children && <p className="text-ink-soft mt-3 max-w-2xl">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, text, to = '/app/analyze', cta = 'New analysis' }) {
  return (
    <div className="rounded-[2rem] bg-paper border border-line p-10 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="text-sm text-ink-soft mt-2 max-w-md mx-auto">{text}</p>
      {cta && (
        <Link to={to} className="inline-block mt-6 px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition">
          {cta}
        </Link>
      )}
    </div>
  );
}

/** A button that asks "are you sure?" in place, before doing anything destructive. */
export function ConfirmButton({ label, question, confirmLabel = 'Yes, delete', onConfirm, className = '' }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={className ||
        'px-4 py-2 rounded-full border border-line text-[13px] font-semibold text-red-700 hover:border-red-300 transition'}>
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm">{question}</span>
      <button type="button" disabled={busy}
        onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); setAsking(false); } }}
        className="px-4 py-2 rounded-full bg-alert text-white text-[13px] font-semibold disabled:opacity-50">
        {busy ? 'Working…' : confirmLabel}
      </button>
      <button type="button" onClick={() => setAsking(false)}
        className="px-4 py-2 rounded-full border border-line text-[13px] font-semibold">
        Keep
      </button>
    </span>
  );
}

/** Plain names for the body areas a report is scored by. */
export const AREA_LABEL = {
  elbow: 'Elbow', knee: 'Knee', shoulder: 'Shoulder', trunk: 'Upper body',
  timing: 'Timing', power: 'Speed', balance: 'Balance',
};
export const areaName = (key) => AREA_LABEL[key] ?? key;
