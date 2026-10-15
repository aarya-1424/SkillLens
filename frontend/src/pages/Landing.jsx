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

export default function Landing() {
  const { signedIn } = useAuth();
  const cta = signedIn ? '/app' : '/login';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-20 h-16 bg-white/70 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-ink-soft">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="hover:text-ink transition">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {!signedIn && <Link to="/login" className="hidden sm:inline px-4 py-2 text-sm font-medium text-ink hover:text-brand transition">Log in</Link>}
            <Link to={cta} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-deep transition shadow-md shadow-brand/25">
              {signedIn ? 'Open app' : 'Try it free'}
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky via-canvas to-canvas">
        <div className="pointer-events-none absolute -top-40 left-[20%] w-[700px] h-[500px] rounded-full bg-brand/20 blur-3xl glow" />
        <div className="pointer-events-none absolute top-10 right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <p className="fade-up eyebrow mb-6">· Your AI coach ·</p>
            <h1 className="fade-up delay-1 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight">
              Train like someone is <em className="text-brand">watching your form.</em>
            </h1>
            <p className="fade-up delay-2 mt-7 text-lg sm:text-xl text-ink-soft max-w-xl leading-relaxed">
              Record a short video of yourself playing. SkillLens measures your technique, warns you about injury risk, and gives you the drills and the weekly plan to get better — using nothing but your camera.
            </p>
            <div className="fade-up delay-3 mt-9 flex flex-wrap items-center gap-3">
              <Link to={cta} className="px-6 py-3.5 rounded-full bg-brand text-white font-medium hover:bg-brand-deep transition shadow-lg shadow-brand/25">
                Try it free →
              </Link>
              <a href="#how" className="px-6 py-3.5 rounded-full border border-brand-soft bg-white/80 text-brand-deep font-medium hover:bg-white transition">
                See how it works
              </a>
            </div>
            <p className="fade-up delay-3 mt-5 text-sm text-ink-soft">No sensors. Nothing to install. Nine sports.</p>
          </div>
          <div className="md:col-span-5 fade-up delay-2 flex md:justify-end">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ---------- Trust numbers ---------- */}
      <section className="border-y border-line bg-gradient-to-r from-sky via-sky-deep/70 to-sky">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-serif text-5xl text-brand-deep">
                <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="text-sm text-ink-soft mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Pinned feature tabs ---------- */}
      <FeatureTabs />

      {/* ---------- How it works ---------- */}
      <section id="how" className="bg-gradient-to-b from-sky-deep/60 to-sky border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-4">How it works</p>
            <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] mb-10">
              Measured, <em className="text-brand">not guessed.</em>
            </h2>
            <ol className="space-y-7">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-brand text-white text-sm font-semibold flex items-center justify-center">{s.n}</span>
                  <div>
                    <h3 className="text-lg font-medium">{s.title}</h3>
                    <p className="text-ink-soft mt-1 leading-relaxed">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <HeroVisual compact />
            <div className="rounded-2xl bg-white border border-line p-4">
              <div className="flex justify-between text-xs text-ink-soft mb-2"><span>Comparing with correct form…</span><span>cricket · bowling</span></div>
              <div className="h-2 rounded-full bg-sky overflow-hidden"><div className="progress-loop h-full bg-brand rounded-full" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Journey ---------- */}
      <section id="journey" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow mb-4">Your journey</p>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05]">
            From first video <em className="text-brand">to weekly habit.</em>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {JOURNEY.map((j, i) => (
            <div key={j.n} className={`rounded-3xl border p-6 ${i === 0 ? 'bg-gradient-to-br from-brand to-brand-dark text-white border-brand' : 'bg-white border-line hover:border-brand/50 hover:-translate-y-0.5 transition'}`}>
              <div className={`text-xs ${i === 0 ? 'text-white/60' : 'text-ink-soft'}`}>{j.n}</div>
              <h3 className="font-serif text-2xl mt-6">{j.title}</h3>
              <span className={`inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full ${i === 0 ? 'bg-white/20' : 'bg-brand-soft text-brand-dark'}`}>{j.tag}</span>
              <p className={`mt-4 text-sm leading-relaxed ${i === 0 ? 'text-white/80' : 'text-ink-soft'}`}>{j.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-ink-soft mt-8">Every new video builds on the last one. You never start from zero.</p>
      </section>

      {/* ---------- Sports ---------- */}
      <SportPicker cta={cta} />

      {/* ---------- Sample report ---------- */}
      <SampleReport cta={cta} />

      {/* ---------- Coaches ---------- */}
      <section id="coaches" className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-4 !text-blue-300">For coaches & academies</p>
            <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] mb-5">
              Eyes on every player, <em className="text-blue-300">every session.</em>
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              One coach cannot watch thirty players at once. SkillLens can. See who is improving, who is drifting into risky form, and send the right drill to the right player.
            </p>
            <span className="inline-block mt-7 px-3 py-1.5 rounded-full border border-white/20 text-sm text-white/80">Coming soon · after the prototype</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4">
            {[
              ['Squad overview', 'Every player’s latest score and trend on one screen.'],
              ['Risk alerts', 'Know who needs a technique check before they get hurt.'],
              ['Assign drills', 'Send a drill to a player; see when they did it.'],
              ['Fair comparison', 'The same measured scores for every player, every time.'],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-medium">{t}</h3>
                <p className="text-sm text-white/65 mt-1.5 leading-relaxed">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section id="trust" className="bg-sky border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-4">Trust & safety</p>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05]">Built carefully, <em className="text-brand">because it's your body.</em></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-3xl bg-white border border-line p-6">
              <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center mb-5" aria-hidden="true">✓</div>
              <h3 className="font-medium">{t.title}</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <Faq />

      {/* ---------- Final CTA ---------- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-brand-deep to-brand-dark text-white px-6 py-16 sm:py-20 text-center">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-serif text-4xl sm:text-5xl leading-[1.05]">Ready to see your game <em>clearly?</em></h2>
          <p className="relative mt-4 text-white/80 text-lg">Your first report takes less than a minute.</p>
          <Link to={cta} className="relative inline-block mt-8 px-7 py-3.5 rounded-full bg-white text-brand-deep font-medium hover:bg-blue-50 transition">
            Try it free →
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-line bg-sky/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-soft">
          <Logo />
          <p>© {new Date().getFullYear()} SkillLens · Coaching guidance, not medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
