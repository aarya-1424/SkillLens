import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { saveProfile } from '../services/profile';
import { SPORTS } from '../data/landing';
import { POLICY_VERSION } from '../data/legal';
import {
  ADULT_AGE, AREAS, FITNESS, GENDERS, GOALS, LEVELS, MONTHS, PAIN, ROLES, SIDES, STEPS, WHY, YEARS, ageFrom,
} from '../data/profileQuestions';

const DRAFT_KEY = 'skilllens.setupDraft';
const LABEL = 'text-[11px] font-bold tracking-[0.18em] uppercase';
const NOT_SURE = 'Not sure yet';
const THIS_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: THIS_YEAR - 5 - 1940 + 1 }, (_, i) => THIS_YEAR - 5 - i);

// ── small building blocks ────────────────────────────────────────────────────

function Question({ label, why, error, optional, children }) {
  return (
    <div className="py-6 border-b border-line last:border-0">
      {label && (
        <p className="font-semibold">
          {label}{optional && <span className="ml-2 text-xs font-medium text-ink-soft">Optional</span>}
        </p>
      )}
      {why && <p className="text-xs text-ink-soft mt-1 mb-4 leading-relaxed"><span className="font-semibold">Why we ask:</span> {why}</p>}
      {children}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function Chips({ options, value, onChange, multi = false, columns = '' }) {
  const isOn = (k) => (multi ? (value || []).includes(k) : value === k);
  const toggle = (k) => {
    if (!multi) return onChange(k);
    const list = value || [];
    return onChange(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);
  };
  return (
    <div className={columns || 'flex flex-wrap gap-2'} role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => {
        const on = isOn(o.key);
        return (
          <button key={o.key} type="button" onClick={() => toggle(o.key)}
            role={multi ? 'checkbox' : 'radio'} aria-checked={on}
            className={`text-left px-4 py-2.5 rounded-full border text-sm transition ${on
              ? 'bg-ink text-white border-ink'
              : 'bg-paper border-line hover:border-ink/40'} ${o.hint ? 'rounded-3xl py-3' : ''}`}>
            <span className="font-semibold">{o.icon && <span className="mr-1.5" aria-hidden="true">{o.icon}</span>}{o.label}</span>
            {o.hint && <span className={`block text-xs mt-0.5 ${on ? 'text-white/60' : 'text-ink-soft'}`}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

const inputClass = 'w-full px-4 py-3 rounded-2xl border border-line bg-paper text-sm focus:outline-none focus:border-ink/60';

function UnitToggle({ units, value, onChange }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-sand">
      {units.map((u) => (
        <button key={u} type="button" onClick={() => onChange(u)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${value === u ? 'bg-ink text-white' : 'text-ink-soft'}`}>
          {u}
        </button>
      ))}
    </div>
  );
}

const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

// ── the answers ──────────────────────────────────────────────────────────────

function blank(firstName) {
  return {
    display_name: firstName || '', birth_year: null, birth_month: null, gender: null,
    sport_slug: null, role: null, level: null, years_playing: null, training_days: null,
    dominant_hand: null, dominant_foot: null,
    height_cm: null, weight_kg: null, fitness: null, pain_now: null, pain_areas: [],
    past_injuries: [], injury_note: '', goal: null, goal_event: '', goal_date: '',
    accept_terms: false, guardian_name: '', guardian_email: '', guardian_consent: false,
  };
}

function fromProfile(p) {
  return {
    ...blank(), ...p,
    injury_note: p.injury_note || '', goal_event: p.goal_event || '', goal_date: p.goal_date || '',
    guardian_name: p.guardian_name || '', guardian_email: p.guardian_email || '',
    guardian_consent: Boolean(p.guardian_name),
    // Only counts as agreed if they agreed to the CURRENT version.
    accept_terms: p.terms_version === POLICY_VERSION,
  };
}

function problems(step, a, noInjuries) {
  const e = {};
  const age = ageFrom(a.birth_year, a.birth_month);
  if (step === 0) {
    if (!a.display_name.trim()) e.display_name = 'Tell us what to call you.';
    if (!a.birth_year || !a.birth_month) e.birth = 'Choose your month and year of birth.';
    else if (age < 5) e.birth = 'SkillLens is for athletes aged 5 and over.';
    if (!a.gender) e.gender = 'Choose one, or "Prefer not to say".';
  }
  if (step === 1) {
    if (!a.sport_slug) e.sport_slug = 'Choose your main sport.';
    if (!a.level) e.level = 'Choose your level.';
    if (!a.years_playing) e.years_playing = 'Choose how long you have played.';
    if (a.training_days == null) e.training_days = 'Choose how many days.';
    if (!a.dominant_hand) e.dominant_hand = 'Choose a hand.';
    if (!a.dominant_foot) e.dominant_foot = 'Choose a foot.';
  }
  if (step === 2) {
    if (!a.height_cm || a.height_cm < 100 || a.height_cm > 230) e.height = 'Enter a height between 100 and 230 cm (3 ft 4 in to 7 ft 6 in).';
    if (!a.weight_kg || a.weight_kg < 20 || a.weight_kg > 200) e.weight = 'Enter a weight between 20 and 200 kg.';
    if (!a.fitness) e.fitness = 'Choose one.';
    if (!a.pain_now) e.pain_now = 'Choose one.';
    if (a.pain_now && a.pain_now !== 'none' && !a.pain_areas.length) e.pain_areas = 'Tap where it hurts.';
    if (!a.past_injuries.length && !noInjuries) e.past_injuries = 'Tap any old injuries, or "No past injuries".';
  }
  if (step === 3) {
    if (!a.goal) e.goal = 'Choose your main goal.';
  }
  if (step === 4) {
    if (!a.accept_terms) e.accept_terms = 'Please agree to continue.';
    if (age != null && age < ADULT_AGE) {
      if (!a.guardian_name.trim()) e.guardian_name = 'Enter your parent or guardian\'s name.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.guardian_email.trim())) e.guardian_email = 'Enter a valid email address.';
      if (!a.guardian_consent) e.guardian_consent = 'Your parent or guardian needs to agree.';
    }
  }
  return e;
}

function toPayload(a) {
  const age = ageFrom(a.birth_year, a.birth_month);
  const minor = age != null && age < ADULT_AGE;
  return {
    display_name: a.display_name.trim(), birth_year: a.birth_year, birth_month: a.birth_month, gender: a.gender,
    sport_slug: a.sport_slug, role: a.role && a.role !== NOT_SURE ? a.role : null,
    level: a.level, years_playing: a.years_playing, training_days: a.training_days,
    dominant_hand: a.dominant_hand, dominant_foot: a.dominant_foot,
    height_cm: Math.round(a.height_cm * 10) / 10, weight_kg: Math.round(a.weight_kg * 10) / 10,
    fitness: a.fitness, pain_now: a.pain_now, pain_areas: a.pain_now === 'none' ? [] : a.pain_areas,
    past_injuries: a.past_injuries, injury_note: a.injury_note.trim() || null,
    goal: a.goal, goal_event: a.goal_event.trim() || null, goal_date: a.goal_date || null,
    accept_terms: a.accept_terms,
    guardian_name: minor ? a.guardian_name.trim() : null,
    guardian_email: minor ? a.guardian_email.trim() : null,
    guardian_consent: minor ? a.guardian_consent : false,
  };
}

// ── the page ─────────────────────────────────────────────────────────────────

export default function Setup() {
  const { displayName, guest } = useAuth();
  const { profile, setProfile } = useProfile();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editing = Boolean(profile);
  // Agreed to an older version of the Terms: they must agree again, so no way out without it.
  const mustReagree = editing && profile.terms_version !== POLICY_VERSION;
  const firstName = (displayName || '').split(' ')[0];

  const [a, setA] = useState(() => {
    if (profile) return fromProfile(profile);
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (draft) return { ...blank(), ...draft };
    } catch { /* ignore */ }
    return blank(guest ? '' : firstName);
  });
  // Jumping to a step is for editing only; a first-time setup goes in order.
  const [step, setStep] = useState(() => (editing ? Math.min(4, Math.max(0, Number(params.get('step')) || 0)) : 0));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [noInjuries, setNoInjuries] = useState(() => Boolean(profile) && !profile.past_injuries?.length);

  // Keep a draft so a refresh does not lose the answers.
  useEffect(() => {
    if (editing) return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(a)); } catch { /* ignore */ }
  }, [a, editing]);

  const set = (field) => (value) => setA((prev) => ({ ...prev, [field]: value }));
  const age = ageFrom(a.birth_year, a.birth_month);
  const minor = age != null && age < ADULT_AGE;
  const errors = useMemo(() => (tried ? problems(step, a, noInjuries) : {}), [tried, step, a, noInjuries]);
  const sport = SPORTS.find((s) => s.slug === a.sport_slug);

  const next = async () => {
    const found = problems(step, a, noInjuries);
    setTried(true);
    if (Object.keys(found).length) return;
    setTried(false);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const saved = await saveProfile(toPayload(a));
      setProfile(saved);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      navigate('/app', { replace: true });
    } catch (err) {
      setSaveError(typeof err.detail === 'string' ? err.detail
        : 'We could not save that just now. Check your connection and try again.');
      setSaving(false);
    }
  };
  const back = () => { setTried(false); setStep(Math.max(0, step - 1)); window.scrollTo({ top: 0 }); };

  // Height in feet and inches, for people who think that way.
  // Work from whole inches so 5 ft never shows as "4 ft 12 in".
  const totalInches = a.height_cm ? Math.round(a.height_cm / 2.54) : null;
  const feet = totalInches != null ? Math.floor(totalInches / 12) : '';
  const inches = totalInches != null ? totalInches % 12 : '';
  const setFeetInches = (f, i) => {
    const total = (num(f) || 0) * 12 + (num(i) || 0);
    set('height_cm')(total ? total * 2.54 : null);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink p-3 sm:p-4 grid lg:grid-cols-12 gap-3">
      {/* Left: where you are */}
      <aside className="hidden lg:flex lg:col-span-4 relative overflow-hidden rounded-[2.2rem] bg-stage stage-grid text-white p-10 flex-col">
        <div className="pointer-events-none absolute -bottom-40 -left-32 w-[30rem] h-[30rem] rounded-full bg-brand/30 blur-3xl" />
        <div className="relative"><Logo tone="dark" to={editing ? '/app' : '/'} /></div>
        <div className="relative mt-14">
          <p className="eyebrow mb-3">{editing ? 'Your profile' : 'Quick setup'}</p>
          <h2 className="font-display text-[2.2rem] leading-[1.02]">Coaching that <em>fits you.</em></h2>
          <p className="text-white/60 text-sm mt-4 leading-relaxed">
            5 short steps, about 2 minutes. You can change any answer later.
          </p>
        </div>
        <ol className="relative mt-10 space-y-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const now = i === step;
            return (
              <li key={s.key}>
                <button type="button" disabled={i > step} onClick={() => setStep(i)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-left transition ${now ? 'bg-white/10' : ''} disabled:cursor-default`}>
                  <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-mint text-white' : now ? 'bg-brand text-white' : 'bg-white/10 text-white/50'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={`font-display text-sm ${now ? 'text-white' : done ? 'text-white/70' : 'text-white/40'}`}>{s.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="relative mt-auto text-xs text-white/40 leading-relaxed">
          Your answers are private to you. We use them only to fit your reports and coaching to you.
        </p>
      </aside>

      {/* Right: the questions */}
      <main className="lg:col-span-8 flex flex-col">
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-6 pt-4 lg:pt-10 pb-32 flex-1">
          <div className="lg:hidden flex items-center justify-between mb-6">
            <Logo compact />
            {editing && !mustReagree && <Link to="/app" className="text-sm font-semibold text-ink-soft">Close</Link>}
          </div>
          <div className="lg:hidden h-1.5 rounded-full bg-sand mb-6 overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="eyebrow">Step {step + 1} of {STEPS.length}</p>
            {editing && !mustReagree && <Link to="/app" className="hidden lg:inline text-sm font-semibold text-ink-soft hover:text-ink">Close without saving</Link>}
          </div>
          <h1 className="font-display text-3xl sm:text-[2.4rem] leading-[1.05] mt-3 mb-2">
            {step === 0 && <>Hi{a.display_name ? `, ${a.display_name.split(' ')[0]}` : ''}. <em>Tell us about you.</em></>}
            {step === 1 && <>Your <em>sport</em></>}
            {step === 2 && <>Your <em>body</em></>}
            {step === 3 && <>Your <em>goal</em></>}
            {step === 4 && <>Last step: <em>your consent</em></>}
          </h1>

          {step === 0 && (
            <>
              <Question label="What should we call you?" why={WHY.display_name} error={errors.display_name}>
                <input className={inputClass} value={a.display_name} maxLength={60} aria-label="What should we call you"
                  onChange={(e) => set('display_name')(e.target.value)} placeholder="Your first name" />
              </Question>
              <Question label="When were you born?" why={WHY.birth} error={errors.birth}>
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  <select className={inputClass} value={a.birth_month || ''} aria-label="Month of birth"
                    onChange={(e) => set('birth_month')(Number(e.target.value) || null)}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <select className={inputClass} value={a.birth_year || ''} aria-label="Year of birth"
                    onChange={(e) => set('birth_year')(Number(e.target.value) || null)}>
                    <option value="">Year</option>
                    {YEARS_LIST.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {minor && <p className="text-xs text-ink-soft mt-2">You are {age}. We will ask for a parent or guardian's agreement at the end.</p>}
              </Question>
              <Question label="Gender" why={WHY.gender} error={errors.gender}>
                <Chips options={GENDERS} value={a.gender} onChange={set('gender')} />
              </Question>
            </>
          )}

          {step === 1 && (
            <>
              <Question label="Your main sport" why={WHY.sport_slug} error={errors.sport_slug}>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SPORTS.map((s) => {
                    const on = s.slug === a.sport_slug;
                    return (
                      <button key={s.slug} type="button" aria-pressed={on}
                        onClick={() => setA((p) => ({ ...p, sport_slug: s.slug, role: p.sport_slug === s.slug ? p.role : null }))}
                        className={`p-4 rounded-3xl border text-left transition ${on ? 'bg-brand text-white border-brand' : 'bg-paper border-line hover:border-ink/30'}`}>
                        <div className="text-2xl mb-3" aria-hidden="true">{s.icon}</div>
                        <div className="font-display text-[0.7rem] leading-tight">{s.name}</div>
                      </button>
                    );
                  })}
                </div>
              </Question>
              {sport && (
                <Question label={`Your role in ${sport.name.toLowerCase()}`} why={WHY.role} optional>
                  <Chips options={[...ROLES[sport.slug], NOT_SURE].map((r) => ({ key: r, label: r }))}
                    value={a.role} onChange={set('role')} />
                </Question>
              )}
              <Question label="Your level" why={WHY.level} error={errors.level}>
                <Chips options={LEVELS} value={a.level} onChange={set('level')} columns="grid grid-cols-2 gap-2" />
              </Question>
              <Question label="How long have you played?" why={WHY.years_playing} error={errors.years_playing}>
                <Chips options={YEARS} value={a.years_playing} onChange={set('years_playing')} />
              </Question>
              <Question label="How many days a week do you train?" why={WHY.training_days} error={errors.training_days}>
                <Chips options={[0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({ key: n, label: String(n) }))}
                  value={a.training_days} onChange={set('training_days')} />
              </Question>
              <Question label="Which hand do you throw, bowl or hit with?" why={WHY.dominant_hand} error={errors.dominant_hand}>
                <Chips options={SIDES} value={a.dominant_hand} onChange={set('dominant_hand')} />
              </Question>
              <Question label="Which foot do you kick with?" why={WHY.dominant_foot} error={errors.dominant_foot}>
                <Chips options={SIDES} value={a.dominant_foot} onChange={set('dominant_foot')} />
              </Question>
            </>
          )}

          {step === 2 && (
            <>
              <Question label="Height" why={WHY.height} error={errors.height}>
                <div className="flex items-center gap-3 flex-wrap">
                  {heightUnit === 'cm' ? (
                    <input className={`${inputClass} max-w-[9rem]`} inputMode="decimal" placeholder="e.g. 170"
                      value={a.height_cm ? Math.round(a.height_cm) : ''} aria-label="Height in centimetres"
                      onChange={(e) => set('height_cm')(num(e.target.value))} />
                  ) : (
                    <>
                      <input className={`${inputClass} max-w-[6rem]`} inputMode="numeric" placeholder="ft" aria-label="Feet"
                        value={feet} onChange={(e) => setFeetInches(e.target.value, inches)} />
                      <input className={`${inputClass} max-w-[6rem]`} inputMode="numeric" placeholder="in" aria-label="Inches"
                        value={inches} onChange={(e) => setFeetInches(feet, e.target.value)} />
                    </>
                  )}
                  <UnitToggle units={['cm', 'ft']} value={heightUnit} onChange={setHeightUnit} />
                </div>
              </Question>
              <Question label="Weight" why={WHY.weight} error={errors.weight}>
                <div className="flex items-center gap-3">
                  <input className={`${inputClass} max-w-[9rem]`} inputMode="decimal"
                    placeholder={weightUnit === 'kg' ? 'e.g. 65' : 'e.g. 145'} aria-label={`Weight in ${weightUnit}`}
                    value={a.weight_kg ? Math.round(weightUnit === 'kg' ? a.weight_kg : a.weight_kg * 2.20462) : ''}
                    onChange={(e) => {
                      const v = num(e.target.value);
                      set('weight_kg')(v == null ? null : weightUnit === 'kg' ? v : v / 2.20462);
                    }} />
                  <UnitToggle units={['kg', 'lb']} value={weightUnit} onChange={setWeightUnit} />
                </div>
              </Question>
              <Question label="How fit do you feel right now?" why={WHY.fitness} error={errors.fitness}>
                <Chips options={FITNESS} value={a.fitness} onChange={set('fitness')} columns="grid grid-cols-2 gap-2" />
              </Question>
              <Question label="Any pain right now?" why={WHY.pain_now} error={errors.pain_now}>
                <Chips options={PAIN} value={a.pain_now} onChange={set('pain_now')} columns="grid grid-cols-3 gap-2" />
                {a.pain_now === 'stops_me' && (
                  <div className="mt-4 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-sm">
                    Please see a doctor or physio before training hard. SkillLens can still check your technique,
                    but it cannot tell you what is wrong.
                  </div>
                )}
              </Question>
              {a.pain_now && a.pain_now !== 'none' && (
                <Question label="Where does it hurt?" why={WHY.pain_areas} error={errors.pain_areas}>
                  <Chips options={AREAS} value={a.pain_areas} onChange={set('pain_areas')} multi />
                </Question>
              )}
              <Question label="Any past injuries?" why={WHY.past_injuries} error={errors.past_injuries}>
                <Chips options={AREAS} value={a.past_injuries} multi
                  onChange={(v) => { setNoInjuries(false); set('past_injuries')(v); }} />
                <button type="button" onClick={() => { setNoInjuries(!noInjuries); set('past_injuries')([]); }}
                  aria-pressed={noInjuries}
                  className={`mt-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition ${noInjuries ? 'bg-ink text-white border-ink' : 'bg-paper border-line hover:border-ink/40'}`}>
                  No past injuries
                </button>
              </Question>
              {a.past_injuries.length > 0 && (
                <Question label="Anything else about your injuries?" why={WHY.injury_note} optional>
                  <input className={inputClass} value={a.injury_note} maxLength={300} aria-label="More about your injuries"
                    onChange={(e) => set('injury_note')(e.target.value)} placeholder="Type here" />
                </Question>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Question label="What do you want most right now?" why={WHY.goal} error={errors.goal}>
                <Chips options={GOALS} value={a.goal} onChange={set('goal')} columns="grid sm:grid-cols-2 gap-2" />
              </Question>
              <Question label="Training for something?" why={WHY.goal_event} optional>
                <div className="grid sm:grid-cols-[1fr_12rem] gap-2">
                  <input className={inputClass} value={a.goal_event} maxLength={80} aria-label="What you are training for"
                    onChange={(e) => set('goal_event')(e.target.value)} placeholder="e.g. State trials, a tournament" />
                  <input className={inputClass} type="date" value={a.goal_date} aria-label="Date of the event"
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set('goal_date')(e.target.value)} />
                </div>
              </Question>
            </>
          )}

          {step === 4 && (
            <>
              {mustReagree && (
                <div className="mt-6 px-5 py-4 rounded-3xl bg-amber/15 border border-amber/40 text-sm leading-relaxed">
                  <strong>We have updated our Terms and Privacy Policy.</strong> Please read them and agree again to carry on.
                </div>
              )}
              <div className="mt-6 p-7 rounded-[2rem] bg-sand">
                <p className={`${LABEL} text-ink-soft mb-4`}>What we keep, and why</p>
                <ul className="space-y-3 text-sm">
                  {[
                    'Your videos are read on your own device to track your body. They are not uploaded for that.',
                    'Your answers and your reports are saved privately to your account. Only you can see them.',
                    'We use your answers only to fit your reports and coaching to you. We do not sell them.',
                    'The AI that writes summaries gets your numbers, never your name, email, exact age or weight. You can switch it off.',
                    'You can download, correct or delete everything yourself, any time, in Privacy & data.',
                    'SkillLens gives coaching guidance, not medical advice. It never diagnoses injuries.',
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-brand shrink-0" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Question label="Your agreement" error={errors.accept_terms}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" aria-label="I agree to the Terms of Service and Privacy Policy" checked={a.accept_terms} onChange={(e) => set('accept_terms')(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-[#d7282f]" />
                  <span className="text-sm leading-relaxed">
                    I have read and agree to the{' '}
                    <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold underline">Terms of Service</a> and the{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold underline">Privacy Policy</a>.
                  </span>
                </label>
              </Question>

              {minor && (
                <div className="mt-2 p-7 rounded-[2rem] border border-line bg-paper">
                  <p className="font-display text-lg">Parent or guardian</p>
                  <p className="text-sm text-ink-soft mt-1 mb-2 leading-relaxed">
                    You are {age}, so the law asks for a parent or guardian to agree before you use SkillLens.
                    Ask them to fill this in with you.
                  </p>
                  <Question label="Their full name" error={errors.guardian_name}>
                    <input className={inputClass} value={a.guardian_name} maxLength={120} aria-label="Parent or guardian's full name"
                      onChange={(e) => set('guardian_name')(e.target.value)} />
                  </Question>
                  <Question label="Their email" why="So we can contact them about your account if we ever need to." error={errors.guardian_email}>
                    <input className={inputClass} type="email" value={a.guardian_email} maxLength={320} aria-label="Parent or guardian's email"
                      onChange={(e) => set('guardian_email')(e.target.value)} />
                  </Question>
                  <Question error={errors.guardian_consent}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" aria-label="Parent or guardian agrees" checked={a.guardian_consent}
                        onChange={(e) => set('guardian_consent')(e.target.checked)} className="mt-1 w-5 h-5 accent-[#d7282f]" />
                      <span className="text-sm leading-relaxed">
                        I am this athlete's parent or guardian. I have read the Terms of Service and Privacy Policy, and I
                        agree to them using SkillLens.
                      </span>
                    </label>
                  </Question>
                </div>
              )}

              {guest && (
                <p className="mt-4 text-xs text-ink-soft">Demo mode: your answers are kept in this browser only.</p>
              )}
              {saveError && (
                <div className="mt-4 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{saveError}</div>
              )}
            </>
          )}
        </div>

        {/* Buttons stay in reach on a phone */}
        <div className="sticky bottom-3 w-full max-w-2xl mx-auto px-2 sm:px-6">
          <div className="flex gap-2 p-2 rounded-full bg-paper/95 backdrop-blur border border-line shadow-[0_12px_40px_-22px_rgba(0,0,0,0.4)]">
            {step > 0 && (
              <button type="button" onClick={back} className="px-6 py-3.5 rounded-full font-semibold text-ink-soft hover:text-ink">
                Back
              </button>
            )}
            <button type="button" onClick={next} disabled={saving}
              className="flex-1 px-6 py-3.5 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition shadow-lg shadow-brand/25 disabled:opacity-60">
              {step < STEPS.length - 1 ? 'Continue' : saving ? 'Saving…' : editing ? 'Save changes' : 'Finish setup'}
            </button>
          </div>
          {tried && Object.keys(errors).length > 0 && (
            <p className="text-center text-sm text-red-700 mt-2">Please answer the questions marked in red.</p>
          )}
        </div>
      </main>
    </div>
  );
}
