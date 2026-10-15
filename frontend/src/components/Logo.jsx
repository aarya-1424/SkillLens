import { Link } from 'react-router-dom';

/** Wordmark. `tone="dark"` for dark headers (the in-app screens), default is light. */
export default function Logo({ to = '/', size = 'md', tone = 'light' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-xl';
  const box = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const colour = tone === 'dark' ? 'text-white' : 'text-ink';
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="SkillLens home">
      <svg viewBox="0 0 64 64" className={box} aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#lg)" />
        <circle cx="32" cy="32" r="17" fill="none" stroke="#fff" strokeWidth="5" />
        <circle cx="32" cy="32" r="6" fill="#fff" />
      </svg>
      <span className={`${text} ${colour} font-semibold tracking-tight`}>SkillLens</span>
    </Link>
  );
}
