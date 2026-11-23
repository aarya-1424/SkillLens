import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DrillCard from '../components/DrillCard';
import CoachDrills from '../components/CoachDrills';
import { EmptyState, LABEL, PageHeader, shortDate } from '../components/Bits';
import { useAuth } from '../context/AuthContext';
import { getPlan } from '../services/history';

const KIND_LOOK = {
  technique: 'bg-stage text-white stage-grid',
  strength: 'bg-paper border border-line',
  film: 'bg-brand text-white',
  rest: 'bg-sand',
};

/** This week's plan: seven days, built from the latest report and the setup answers. */
export default function Plan() {
  const { guest } = useAuth();
  const [plan, setPlan] = useState(undefined);
  const [error, setError] = useState('');
  const [openDay, setOpenDay] = useState(0);

  useEffect(() => {
    getPlan().then(setPlan).catch((err) => {
      if (err.status === 404) setPlan(null);
      else setError('Could not build your plan just now. The server may be waking up; try again in a minute.');
    });
  }, [guest]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Training plan" title={<>Your <em>week</em></>}
        action={plan?.report_id && (
          <Link to={`/app/reports/${plan.report_id}`} className="px-5 py-2.5 rounded-full border border-line bg-paper text-sm font-semibold hover:border-ink/40 transition text-center">
            See the report it is built on
          </Link>
        )}>
        {plan
          ? <>Seven days built from {plan.based_on_report ? <>your {plan.movement?.toLowerCase()} report of {shortDate(plan.based_on_report)}</> : 'your setup answers'} and what you told us about your body and goals. Film again at the end of the week and the plan updates itself.</>
          : 'Built from your latest report and your setup answers.'}
      </PageHeader>

      <CoachDrills />

      {error && <div className="mb-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{error}</div>}
      {plan === undefined && !error && <p className="text-ink-soft">Building your plan…</p>}
      {plan === null && <EmptyState title="Set up your profile first" text="Your plan uses your training days, level, fitness and any sore areas." to="/app/setup" cta="Set up my profile" />}

      {plan && (
        <>
          {plan.notes.length > 0 && (
            <div className="mb-3 p-6 rounded-[2rem] bg-amber/10 border border-amber/30 space-y-2">
              {plan.notes.map((n) => (
                <p key={n} className="text-sm flex gap-3"><span className="w-1.5 h-1.5 mt-2 rounded-full bg-amber shrink-0" />{n}</p>
              ))}
            </div>
          )}

          {/* The week at a glance */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {plan.days.map((d, i) => (
              <button key={d.date} type="button" onClick={() => setOpenDay(i)} aria-pressed={openDay === i}
                className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-left transition ${KIND_LOOK[d.kind]} ${openDay === i ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : ''}`}>
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold tracking-[0.12em] uppercase opacity-70">
                  {d.weekday.slice(0, 3)}{i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-label="today" />}
                </span>
                <span className="hidden sm:block font-display text-[0.7rem] leading-tight mt-2">{d.title}</span>
                <span className="block text-[10px] sm:text-xs mt-1 opacity-70">{d.kind === 'rest' ? 'Rest' : `${d.minutes} min`}</span>
              </button>
            ))}
          </div>

          {/* The chosen day */}
          {(() => {
            const d = plan.days[openDay];
            return (
              <section className="p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
                <p className={`${LABEL} text-ink-soft`}>{openDay === 0 ? 'Today' : d.weekday} · {shortDate(d.date)}</p>
                <h2 className="font-display text-xl sm:text-2xl mt-2">{d.title}</h2>
                {d.kind === 'rest' ? (
                  <p className="text-ink-soft mt-3">{d.note}</p>
                ) : (
                  <>
                    <p className="text-sm text-ink-soft mt-1">About {d.minutes} minutes · {d.items.length} parts. Tap “How” on any drill for the steps.</p>
                    <div className="mt-5 space-y-2">
                      {d.items.map((it, k) => (
                        <DrillCard key={`${it.id}-${k}`} drill={it} why={it.why} caution={it.caution} />
                      ))}
                    </div>
                    {d.kind === 'film' && (
                      <Link to="/app/analyze" className="inline-block mt-5 px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition">
                        Record my next video
                      </Link>
                    )}
                  </>
                )}
              </section>
            );
          })()}

          <p className="text-xs text-ink-soft mt-3">
            Drills are not yet signed off by a coach. Coaching guidance, not medical advice: stop anything that hurts.
          </p>
        </>
      )}
    </main>
  );
}
