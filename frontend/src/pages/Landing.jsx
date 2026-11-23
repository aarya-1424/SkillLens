import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import HeroVisual from '../components/landing/HeroVisual';
import CountUp from '../components/landing/CountUp';
import FeatureTabs from '../components/landing/FeatureTabs';
import SportPicker from '../components/landing/SportPicker';
import SampleReport from '../components/landing/SampleReport';
import Faq from '../components/landing/Faq';
import { STATS, STEPS, JOURNEY, TRUST } from '../data/landing';
import { useAuth } from '../context/AuthContext';

const NAV = [
  ['How it works', '#how'],
  ['Sports', '#sports'],
  ['Sample report', '#report'],
  ['For coaches', '#coaches'],
  ['FAQ', '#faq'],
];

/* Thin line icons for the strip under the hero. */
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 text-brand" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const PILLARS = [
  { title: 'Technique score', text: 'A score out of 100 from every check we run on your movement.', d: 'M12 21a9 9 0 1 0-9-9 M12 12l4-4 M12 7v.01 M7 12h.01 M17 12h.01' },
  { title: 'Injury risk', text: 'See which body part is taking the strain before it starts to hurt.', d: 'M12 3l8 4v5c0 4.5-3.2 7.9-8 9-4.800-1.100-8-4.500-8-9V7l8-4z M12 9v4 M12 16v.01' },
  { title: 'Drills that fix it', text: 'Each mistake comes with the simple drill that corrects it.', d: 'M4 10v4 M7 7v10 M17 7v10 M20 10v4 M7 12h10' },
  { title: 'Ask Coach', text: 'Questions answered from our own checked library, with sources.', d: 'M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M8 10h8 M8 13h5' },
];

export default function Landing() {
  const { signedIn } = useAuth();
  const cta = signedIn ? '/app' : '/login';

  return (
    <div className="min-h-screen text-ink">
      {/* ---------- Floating nav ---------- */}
      <header className="fixed top-5 inset-x-0 z-30 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 rounded-full glass shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] pl-3 pr-2 py-2">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-ink-soft">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-ink transition">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {!signedIn && <Link to="/login" className="hidden sm:inline px-4 py-2 text-[13px] font-medium text-ink hover:text-brand transition">Log in</Link>}
            <Link to={cta} className="px-5 py-2.5 rounded-full bg-ink text-white text-[13px] font-semibold hover:bg-brand transition">
              {signedIn ? 'Open app' : 'Try it free'}
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero: a dark stage, inset from the page edge ---------- */}
      <section className="relative mx-3 sm:mx-4 mt-3 rounded-[2.2rem] bg-stage stage-grid text-white overflow-hidden">
        <div className="glow pointer-events-none absolute -top-48 right-[-8%] w-[680px] h-[680px] rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stage via-stage/80 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-9 sm:pb-12 min-h-[660px] lg:min-h-[90vh] flex flex-col">
          <div className="relative h-[300px] sm:h-[360px] lg:h-auto lg:absolute lg:top-24 lg:bottom-56 lg:right-4 lg:w-[44%] fade-up">
            <HeroVisual bare />
          </div>

          <div className="relative mt-auto grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="fade-up eyebrow mb-5">Your AI coach · 10 sports</p>
              <h1 className="fade-up delay-1 font-display text-[clamp(2.05rem,5.1vw,4.5rem)]">
                Train like someone is <em>watching</em> your form.
              </h1>
            </div>
            <div className="lg:col-span-4 fade-up delay-2">
              <p className="font-display text-sm sm:text-base !leading-snug text-white/90 mb-5">
                The fastest way to see what your body is really doing
              </p>
              <Link to={cta} className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition shadow-xl shadow-brand/30">
                Analyse my technique <span aria-hidden="true">→</span>
              </Link>
              <p className="mt-3 text-xs text-white/50 text-center">No sensors. Nothing to install. Just your camera.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Four pillars, tucked under the hero ---------- */}
      <section className="mx-3 sm:mx-4 mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-[1.8rem] bg-paper border border-line p-7 hover:-translate-y-0.5 transition">
            <Icon d={p.d} />
            <h3 className="font-display text-[0.82rem] mt-7 mb-2">{p.title}</h3>
            <p className="text-sm text-ink-soft leading-relaxed">{p.text}</p>
          </div>
        ))}
      </section>

      {/* ---------- Statement + numbers, over ghost words ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none select-none absolute right-[-2%] top-1/2 -translate-y-1/2 font-display text-[clamp(4rem,13vw,11rem)] !leading-[0.9] text-sand-deep/70 text-right" aria-hidden="true">
          Track<br />Measure<br />Improve
        </div>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 sm:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-5">Welcome</p>
            <h2 className="font-display text-3xl sm:text-[2.6rem] mb-6">
              Measured, <em>not guessed.</em>
            </h2>
            <p className="text-ink-soft text-lg leading-relaxed max-w-md mb-8">
              Record a short video of yourself playing. SkillLens follows every joint, measures your technique against correct form, and tells you in plain words what to change — and by how much.
            </p>
            <a href="#how" className="inline-block px-6 py-3.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition">
              See how it works
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-[1.8rem] glass p-6">
                <div className="font-display text-4xl sm:text-5xl">
                  <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="text-sm text-ink-soft mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Feature tabs ---------- */}
      <FeatureTabs />

      {/* ---------- How it works ---------- */}
      <section id="how" className="mx-3 sm:mx-4 rounded-[2.2rem] bg-sand">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-5">How it works</p>
            <h2 className="font-display text-3xl sm:text-[2.6rem] mb-10">
              Four steps. <em>Under a minute.</em>
            </h2>
            <ol className="space-y-7">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="w-10 h-10 shrink-0 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center">{s.n}</span>
                  <div>
                    <h3 className="font-display text-sm">{s.title}</h3>
                    <p className="text-ink-soft mt-1.5 leading-relaxed">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-3">
            <HeroVisual />
            <div className="rounded-full bg-paper border border-line px-5 py-3.5">
              <div className="flex justify-between text-xs text-ink-soft mb-2"><span>Comparing with correct form…</span><span>cricket · bowling</span></div>
              <div className="h-1.5 rounded-full bg-sand overflow-hidden"><div className="progress-loop h-full bg-brand rounded-full" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Journey ---------- */}
      <section id="journey" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mb-12">
          <p className="eyebrow mb-5">Your journey</p>
          <h2 className="font-display text-3xl sm:text-[2.6rem]">
            From first video <em>to weekly habit.</em>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {JOURNEY.map((j, i) => (
            <div key={j.n} className={`rounded-[1.8rem] border p-6 transition ${i === 0 ? 'bg-stage text-white border-stage' : 'bg-paper border-line hover:-translate-y-0.5'}`}>
              <div className={`text-xs font-bold ${i === 0 ? 'text-brand' : 'text-ink-soft'}`}>{j.n}</div>
              <h3 className="font-display text-base mt-8">{j.title}</h3>
              <span className={`inline-block mt-3 text-[11px] font-medium px-2.5 py-1 rounded-full ${i === 0 ? 'bg-white/10 text-white/80' : 'bg-sand text-ink'}`}>{j.tag}</span>
              <p className={`mt-4 text-sm leading-relaxed ${i === 0 ? 'text-white/70' : 'text-ink-soft'}`}>{j.text}</p>
            </div>
          ))}
        </div>
        <p className="text-ink-soft mt-8">Every new video builds on the last one. You never start from zero.</p>
      </section>

      {/* ---------- Sports ---------- */}
      <div className="mx-3 sm:mx-4 rounded-[2.2rem] bg-sand">
        <SportPicker cta={cta} />
      </div>

      {/* ---------- Sample report ---------- */}
      <SampleReport cta={cta} />

      {/* ---------- Coaches ---------- */}
      <section id="coaches" className="relative mx-3 sm:mx-4 rounded-[2.2rem] bg-stage stage-grid text-white overflow-hidden">
        <div className="pointer-events-none absolute -bottom-40 -left-20 w-[520px] h-[520px] rounded-full bg-brand/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-5">For coaches & academies</p>
            <h2 className="font-display text-3xl sm:text-[2.6rem] mb-6">
              Eyes on every player, <em>every session.</em>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              One coach cannot watch thirty players at once. SkillLens can. See who is improving, who is drifting into risky form, and send the right drill to the right player.
            </p>
            <Link to="/login" className="inline-block mt-8 px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition">Start a team →</Link>
            <p className="text-xs text-white/50 mt-3">Players join with an invite code and choose what to share.</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              ['Squad overview', 'Every player’s latest score and trend on one screen.'],
              ['Risk alerts', 'Know who needs a technique check before they get hurt.'],
              ['Assign drills', 'Send a drill to a player; see when they did it.'],
              ['Fair comparison', 'The same measured scores for every player, every time.'],
            ].map(([t, d]) => (
              <li key={t} className="rounded-[1.6rem] bg-stage-soft border border-white/5 p-6">
                <h3 className="font-display text-[0.8rem]">{t}</h3>
                <p className="text-sm text-white/60 mt-2.5 leading-relaxed">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section id="trust" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mb-12">
          <p className="eyebrow mb-5">Trust & safety</p>
          <h2 className="font-display text-3xl sm:text-[2.6rem]">Built carefully, <em>because it's your body.</em></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-[1.8rem] bg-paper border border-line p-6">
              <div className="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center mb-7" aria-hidden="true">✓</div>
              <h3 className="font-display text-[0.8rem] !leading-snug">{t.title}</h3>
              <p className="text-sm text-ink-soft mt-2.5 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <div className="mx-3 sm:mx-4 rounded-[2.2rem] bg-sand">
        <Faq />
      </div>

      {/* ---------- Final CTA ---------- */}
      <section className="mx-3 sm:mx-4 mt-3">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-brand text-white px-6 py-20 sm:py-24 text-center">
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl sm:text-5xl max-w-3xl mx-auto">Ready to see your game clearly?</h2>
          <p className="relative mt-5 text-white/85 text-lg">Your first report takes less than a minute.</p>
          <Link to={cta} className="relative inline-block mt-9 px-8 py-4 rounded-full bg-stage text-white font-semibold hover:bg-ink transition">
            Try it free →
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-soft">
        <Logo />
        <div className="flex flex-col sm:items-end gap-2">
          <nav className="flex gap-4 font-semibold" aria-label="Legal">
            <Link to="/terms" className="hover:text-ink">Terms</Link>
            <Link to="/privacy" className="hover:text-ink">Privacy</Link>
          </nav>
          <p>© {new Date().getFullYear()} SkillLens · Coaching guidance, not medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
