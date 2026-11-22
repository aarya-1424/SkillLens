import { useEffect, useRef, useState } from 'react';
import { get, post } from '../services/api';

/**
 * Ask Coach.
 *
 * Answers come from SkillLens's own checked library, and every answer shows
 * where it came from. When the library has nothing on a question, the coach
 * says so plainly instead of making something up — and we show that honestly
 * rather than dressing it up.
 */
export default function AskCoach({ analysisId, movementSlug, sport }) {
  const [thread, setThread] = useState([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ideas, setIdeas] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    get(`/coach/suggestions?movement=${encodeURIComponent(movementSlug || '')}`)
      .then((list) => alive && setIdeas(list.slice(0, 3)))
      .catch(() => {});
    return () => { alive = false; };
  }, [movementSlug]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread, busy]);

  const send = async (text) => {
    const asked = (text ?? question).trim();
    if (asked.length < 3 || busy) return;
    setError('');
    setQuestion('');
    setThread((t) => [...t, { role: 'user', content: asked }]);
    setBusy(true);
    try {
      const res = await post('/coach/ask', {
        question: asked, analysis_id: analysisId, movement: movementSlug, sport,
      });
      setThread((t) => [...t, { role: 'assistant', ...res }]);
    } catch (err) {
      setError(err.status === 401 || err.status === 503
        ? 'Ask Coach needs you to be signed in.'
        : 'Could not reach the coach just now.');
      setThread((t) => t.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-line bg-paper overflow-hidden no-print">
      <div className="relative overflow-hidden px-7 py-6 bg-stage stage-grid text-white">
        <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-brand/30 blur-3xl" />
        <p className="relative eyebrow mb-1">Your AI coach</p>
        <h2 className="relative font-display text-xl sm:text-2xl">Ask <em>Coach</em></h2>
        <p className="relative text-sm text-white/60 mt-1">
          Answers come from SkillLens's own library, with sources shown.
        </p>
      </div>

      <div className="px-7 py-5 space-y-4 max-h-96 overflow-y-auto">
        {!thread.length && (
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">Not sure what to ask?</p>
            {ideas.map((idea) => (
              <button key={idea} onClick={() => send(idea)}
                className="block w-full text-left text-sm px-4 py-2.5 rounded-full border border-line hover:border-ink/40 hover:bg-sand/50 transition">
                {idea}
              </button>
            ))}
          </div>
        )}

        {thread.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] px-4 py-2.5 rounded-3xl rounded-br-md bg-ink text-white text-sm">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[92%]">
              <div className={`px-4 py-3 rounded-3xl rounded-bl-md border text-sm leading-relaxed ${
                m.grounded ? 'bg-sand/60 border-line' : 'bg-amber/10 border-amber/30'}`}>
                {m.answer}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {m.sources?.map((s) => (
                  <span key={s.id} title={s.verified ? 'Coach-verified' : 'Not yet coach-verified'}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-paper border border-line text-ink-soft">
                    {s.verified ? '✓' : '○'} {s.title}
                  </span>
                ))}
                {m.from_cache && (
                  <span className="text-[10px] text-ink-soft">· answered before</span>
                )}
              </div>
            </div>
          )
        ))}

        {busy && <p className="text-sm text-ink-soft">Looking it up…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-2 px-7 py-4 border-t border-line bg-canvas">
        <input
          value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your technique…" aria-label="Ask Coach a question"
          className="flex-1 px-4 py-2.5 rounded-full border border-line bg-paper text-sm focus:outline-none focus:border-brand"
        />
        <button type="submit" disabled={busy || question.trim().length < 3}
          className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition disabled:opacity-40">
          Ask
        </button>
      </form>
    </section>
  );
}
