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
    <section className="rounded-2xl border border-line bg-white overflow-hidden no-print">
      <div className="px-5 py-4 border-b border-line">
        <h2 className="font-serif text-2xl">Ask Coach</h2>
        <p className="text-sm text-ink-soft mt-0.5">
          Answers come from SkillLens's own library, with sources shown.
        </p>
      </div>

      <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
        {!thread.length && (
          <div className="space-y-2">
            <p className="text-sm text-ink-soft">Not sure what to ask?</p>
            {ideas.map((idea) => (
              <button key={idea} onClick={() => send(idea)}
                className="block w-full text-left text-sm px-3 py-2 rounded-xl border border-line hover:border-brand hover:bg-sky/50 transition">
                {idea}
              </button>
            ))}
          </div>
        )}

        {thread.map((m, i) => (
          m.role === 'user' ? (
            <div key={i} className="ml-auto max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-brand text-white text-sm">
              {m.content}
            </div>
          ) : (
            <div key={i} className="max-w-[92%]">
              <div className={`px-3.5 py-2.5 rounded-2xl rounded-bl-sm border text-sm leading-relaxed ${
                m.grounded ? 'bg-sky/60 border-line' : 'bg-amber-50 border-amber-200'}`}>
                {m.answer}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {m.sources?.map((s) => (
                  <span key={s.id} title={s.verified ? 'Coach-verified' : 'Not yet coach-verified'}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-line text-ink-soft">
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
        className="flex gap-2 px-5 py-4 border-t border-line bg-canvas">
        <input
          value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your technique…" aria-label="Ask Coach a question"
          className="flex-1 px-4 py-2.5 rounded-full border border-line bg-white text-sm focus:outline-none focus:border-brand"
        />
        <button type="submit" disabled={busy || question.trim().length < 3}
          className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-deep transition disabled:opacity-40">
          Ask
        </button>
      </form>
    </section>
  );
}
