import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../services/api';
import { getCoachHistory } from '../services/history';

/**
 * Ask Coach.
 *
 * Answers come from SkillLens's own checked library, and every answer shows
 * where it came from. When the library has nothing on a question, the coach
 * says so plainly instead of making something up — and we show that honestly
 * rather than dressing it up.
 *
 * withHistory: show the earlier conversation (for this report, or overall).
 * tall: a taller conversation area, for the full Ask Coach page.
 */
export default function AskCoach({ analysisId, movementSlug, sport, withHistory = false, tall = false }) {
  const [thread, setThread] = useState([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [aiOff, setAiOff] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const endRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    let alive = true;
    get(`/coach/suggestions?movement=${encodeURIComponent(movementSlug || '')}`)
      .then((list) => alive && setIdeas(list.slice(0, 3)))
      .catch(() => {});
    return () => { alive = false; };
  }, [movementSlug]);

  useEffect(() => {
    if (!withHistory) return undefined;
    let alive = true;
    getCoachHistory(analysisId).then((rows) => {
      if (!alive || !rows?.length) return;
      setThread(rows.map((r) => (r.role === 'user'
        ? { role: 'user', content: r.content }
        : { role: 'assistant', answer: r.content, sources: r.sources, from_cache: r.from_cache, grounded: r.sources.length > 0 })));
    });
    return () => { alive = false; };
  }, [withHistory, analysisId]);

  // Scroll inside the conversation box only, never the whole page.
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [thread, busy]);

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
      setThread((t) => t.slice(0, -1));
      setQuestion(asked);
      if (err.status === 403) setAiOff(true);
      else setError(err.status === 401 || err.status === 503
        ? 'Ask Coach needs you to be signed in.'
        : 'Could not reach the coach just now.');
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

      <div ref={boxRef} className={`px-7 py-5 space-y-4 overflow-y-auto ${tall ? 'h-[28rem]' : 'max-h-96'}`}>
        {!thread.length && !aiOff && (
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
            <div key={i} className="ml-auto max-w-[85%] w-fit px-4 py-2.5 rounded-3xl rounded-br-md bg-ink text-white text-sm">
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
        {aiOff && (
          <div className="px-5 py-4 rounded-3xl bg-amber/15 border border-amber/40 text-sm">
            <strong>AI features are switched off.</strong> You turned them off in{' '}
            <Link to="/app/privacy" className="font-semibold underline">Privacy &amp; data</Link>, so nothing is sent to the AI model.
            Switch them back on there to use Ask Coach.
          </div>
        )}
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
