import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import PoseFigure from '../components/PoseFigure';
import { SPORTS } from '../data/sports';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { n: '1', title: 'Record', text: 'Film a 5–15 second clip of your movement with your phone or laptop camera.' },
  { n: '2', title: 'Analyse', text: 'SkillLens finds 33 body points in every frame and measures your joint angles.' },
  { n: '3', title: 'Improve', text: 'Get your score, mistakes, injury risk, drills and a weekly training plan.' },
];

const FEATURES = [
  { icon: '🎯', title: 'Technique score', text: 'A score out of 100, plus scores for shoulder, elbow, hip, knee and spine.' },
  { icon: '🩺', title: 'Injury risk', text: 'Spot risky movement early and learn which body part is under stress.' },
  { icon: '🏋️', title: 'Drills that fix it', text: 'Simple exercises matched to each mistake we find.' },
  { icon: '🥗', title: 'Training & diet plan', text: 'A weekly plan built around your sport, level, age and body.' },
  { icon: '💬', title: 'Ask Coach', text: 'Ask anything — answers come from our checked sports library.' },
  { icon: '📈', title: 'Progress tracking', text: 'Every video is saved, so you can watch your score climb.' },
];

export default function Landing() {
  const { signedIn } = useAuth();
  const cta = signedIn ? '/app' : '/login';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-teal-500/20 blur-3xl glow" />

      <header className="relative max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Logo />
        <Link to={cta} className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition">
          {signedIn ? 'Open app' : 'Sign in'}
        </Link>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="fade-up inline-block px-3 py-1 mb-5 text-xs font-semibold rounded-full bg-teal-400/10 text-teal-300 border border-teal-400/20">
            AI sports coach · 9 sports · just a camera
          </p>
          <h1 className="fade-up delay-1 text-4xl sm:text-6xl font-extrabold leading-tight">
            Your coach,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500">in your camera.</span>
          </h1>
          <p className="fade-up delay-2 mt-5 text-lg text-gray-300 max-w-lg">
            Record yourself playing. SkillLens checks your technique, warns you about injury risk, and gives you drills
            and a training plan — no sensors, no expensive coaching.
          </p>
          <div className="fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <Link to={cta} className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-blue-600 hover:scale-105 transition shadow-lg shadow-teal-500/20">
              Analyse my technique
            </Link>
            <a href="#how" className="px-6 py-3 rounded-xl font-semibold border border-white/15 hover:bg-white/5 transition">
              How it works
            </a>
          </div>
        </div>
        <div className="fade-up delay-2 flex justify-center">
          <PoseFigure />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="p-6 rounded-2xl bg-gray-900/60 border border-white/10 hover:border-teal-400/40 transition">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 flex items-center justify-center font-bold mb-4">{s.n}</div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sports */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">9 sports, one app</h2>
        <p className="text-center text-gray-400 mb-10">One key movement per sport today — more coming soon.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SPORTS.map((s) => (
            <div key={s.name} className="p-5 rounded-2xl bg-gray-900/60 border border-white/10 hover:-translate-y-1 hover:border-blue-400/40 transition">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-400">{s.movement}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">What you get from one video</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-gray-900/60 border border-white/10">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to see your game clearly?</h2>
        <p className="text-gray-400 mb-8">It takes less than a minute.</p>
        <Link to={cta} className="inline-block px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-teal-500 to-blue-600 hover:scale-105 transition">
          Get started — it's free
        </Link>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} SkillLens · Coaching guidance only, not medical advice.
      </footer>
    </div>
  );
}
