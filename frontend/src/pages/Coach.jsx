import { useState } from 'react';
import { Link } from 'react-router-dom';
import AskCoach from '../components/AskCoach';
import { PageHeader } from '../components/Bits';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { SPORTS } from '../data/landing';

/** Ask Coach on its own page: any question, about any sport. */
export default function Coach() {
  const { guest } = useAuth();
  const { profile } = useProfile();
  const [slug, setSlug] = useState(profile?.sport_slug || SPORTS[0].slug);
  const sport = SPORTS.find((s) => s.slug === slug);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Ask Coach" title={<>Ask <em>anything</em></>}>
        Answers come from SkillLens's checked sports library, with their sources. If the library does not cover
        something, the coach says so instead of guessing.
      </PageHeader>

      <div className="grid lg:grid-cols-12 gap-3">
        <aside className="lg:col-span-4 space-y-3">
          <div className="p-6 rounded-[2rem] bg-paper border border-line">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-3">Which sport?</p>
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.map((s) => (
                <button key={s.slug} type="button" onClick={() => setSlug(s.slug)} aria-pressed={slug === s.slug}
                  className={`text-left px-3 py-2 rounded-2xl border text-[13px] font-semibold transition ${slug === s.slug ? 'bg-ink text-white border-ink' : 'bg-paper border-line hover:border-ink/40'}`}>
                  <span className="mr-1.5" aria-hidden="true">{s.icon}</span>{s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-[2rem] bg-sand text-sm leading-relaxed">
            <p className="font-semibold mb-1">Good to know</p>
            <p className="text-ink-soft">
              {guest
                ? 'Ask Coach needs a signed-in account, because answers are saved to your history.'
                : <>For questions about one report, open it from <Link to="/app/reports" className="font-semibold underline text-ink">My reports</Link>: the coach then knows your numbers.</>}
            </p>
            <p className="text-ink-soft mt-2">
              Your name, email and exact age are never sent to the AI. You can switch AI off in{' '}
              <Link to="/app/privacy" className="font-semibold underline text-ink">Privacy &amp; data</Link>.
            </p>
          </div>
        </aside>
        <div className="lg:col-span-8">
          <AskCoach key={slug} movementSlug={slug} sport={sport.name} withHistory tall />
        </div>
      </div>
    </main>
  );
}
