import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center text-ink">
      <div className="font-display text-8xl"><em>404</em></div>
      <p className="text-ink-soft">This page does not exist.</p>
      <Link to="/" className="px-6 py-3 rounded-full bg-ink text-white text-sm font-semibold hover:bg-brand transition">Go home</Link>
    </div>
  );
}
