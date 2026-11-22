import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import {
  COMPANY, EFFECTIVE, GRIEVANCE_OFFICER, POLICY_LABEL, PRIVACY, RESPONSE_DAYS, TERMS,
} from '../data/legal';

function Body({ parts }) {
  return parts.map((p, i) => {
    if (typeof p === 'string') return <p key={i} className="text-ink-soft leading-relaxed mb-4">{p}</p>;
    if (p.list) {
      return (
        <ul key={i} className="space-y-2.5 mb-4">
          {p.list.map((item) => (
            <li key={item} className="flex gap-3 text-ink-soft leading-relaxed">
              <span className="w-1.5 h-1.5 mt-2.5 rounded-full bg-brand shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (p.note) {
      return <p key={i} className="mb-4 px-5 py-4 rounded-3xl bg-sand text-ink leading-relaxed">{p.note}</p>;
    }
    return null;
  });
}

function GrievanceCard() {
  const rows = [
    ['Name', GRIEVANCE_OFFICER.name],
    ['Role', GRIEVANCE_OFFICER.role],
    ['Organisation', COMPANY.name],
    ['Address', COMPANY.address.join(', ')],
  ];
  return (
    <div className="rounded-[2rem] bg-stage stage-grid text-white p-7 sm:p-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-brand/30 blur-3xl" />
      <p className="relative text-sm text-white/70 leading-relaxed mb-6">
        As required by the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023:
      </p>
      <dl className="relative grid sm:grid-cols-[9rem_1fr] gap-x-6 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-white/50">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
        <dt className="text-white/50">Email</dt>
        <dd><a href={`mailto:${COMPANY.privacyEmail}`} className="font-semibold text-brand-soft underline">{COMPANY.privacyEmail}</a></dd>
        <dt className="text-white/50">Response time</dt>
        <dd className="text-white/80 leading-relaxed">
          We acknowledge complaints within 48 hours and resolve them within {RESPONSE_DAYS} days. The fastest way is
          Privacy &amp; data → Raise a privacy complaint, inside the App, which records it with its date straight away.
        </dd>
      </dl>
      <p className="relative mt-6 text-xs text-white/50 leading-relaxed">
        If you are not satisfied with our answer, you can approach the Data Protection Board of India under the DPDP Act, 2023.
      </p>
    </div>
  );
}

export default function Legal({ kind }) {
  const doc = kind === 'privacy' ? PRIVACY : TERMS;
  const { signedIn } = useAuth();

  useEffect(() => {
    document.title = `${doc.title} · SkillLens`;
    window.scrollTo(0, 0);
    return () => { document.title = 'SkillLens — AI Sports Coach'; };
  }, [doc.title]);

  const tab = (to, label, on) => (
    <Link to={to} className={`px-4 py-2 rounded-full text-[13px] font-semibold transition ${on ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`}>
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-4 z-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 rounded-full bg-paper/95 backdrop-blur border border-line shadow-[0_12px_40px_-22px_rgba(0,0,0,0.4)] pl-3 pr-2 py-2">
          <Logo compact />
          <nav className="flex items-center gap-1" aria-label="Legal pages">
            {tab('/terms', 'Terms', kind === 'terms')}
            {tab('/privacy', 'Privacy', kind === 'privacy')}
          </nav>
          <Link to={signedIn ? '/app' : '/'} className="hidden sm:inline-block px-4 py-2 rounded-full bg-brand text-white text-[13px] font-semibold hover:bg-brand-deep transition">
            {signedIn ? 'Back to app' : 'Home'}
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-stage stage-grid text-white px-7 sm:px-12 py-12 mb-3">
          <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-brand/30 blur-3xl" />
          <p className="relative eyebrow mb-4">{kind === 'privacy' ? 'Legal & privacy' : 'Legal'}</p>
          <h1 className="relative font-display text-3xl sm:text-[2.8rem] leading-[1.02]">{doc.title}</h1>
          <p className="relative text-white/60 mt-4 max-w-xl leading-relaxed">{doc.intro}</p>
          <div className="relative flex flex-wrap gap-2 mt-7">
            {[`Effective ${EFFECTIVE}`, POLICY_LABEL, kind === 'privacy' ? 'DPDP Act 2023' : 'Governed by Indian law'].map((m) => (
              <span key={m} className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold">{m}</span>
            ))}
          </div>
        </section>

        {doc.short && (
          <section className="rounded-[2rem] bg-sand p-7 sm:p-9 mb-3">
            <p className="eyebrow mb-4">The short version</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {doc.short.map((s) => (
                <li key={s} className="flex gap-3 p-4 rounded-3xl bg-paper text-sm leading-relaxed">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-ink text-white text-[11px] flex items-center justify-center" aria-hidden="true">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid lg:grid-cols-12 gap-3">
          <aside className="hidden lg:block lg:col-span-4">
            <nav className="sticky top-28 rounded-[2rem] bg-paper border border-line p-6" aria-label="On this page">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-3">On this page</p>
              <ul className="space-y-1">
                {doc.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block px-3 py-1.5 rounded-full text-sm text-ink-soft hover:text-ink hover:bg-sand transition">{s.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="lg:col-span-8 rounded-[2rem] bg-paper border border-line p-7 sm:p-10">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 pb-6 mb-6 border-b border-line last:border-0 last:mb-0 last:pb-0">
                <h2 className="font-display text-lg sm:text-xl mb-4">{s.title}</h2>
                {s.grievance ? <GrievanceCard /> : <Body parts={s.body} />}
              </section>
            ))}
          </article>
        </div>

        <footer className="mt-3 rounded-[2rem] bg-paper border border-line p-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-ink-soft">
            Questions? <a href={`mailto:${kind === 'privacy' ? COMPANY.privacyEmail : COMPANY.contactEmail}`} className="font-semibold text-ink underline">
              {kind === 'privacy' ? COMPANY.privacyEmail : COMPANY.contactEmail}
            </a>
          </p>
          <Link to={kind === 'privacy' ? '/terms' : '/privacy'} className="font-semibold text-brand hover:text-brand-deep">
            {kind === 'privacy' ? 'Terms of Service →' : 'Privacy Policy →'}
          </Link>
        </footer>
      </main>
    </div>
  );
}
