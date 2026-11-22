import { Link } from 'react-router-dom';

/** Wordmark. `tone="dark"` is for use on the dark stage blocks. */
export default function Logo({ to = '/', size = 'md', tone = 'light', compact = false }) {
  const text = size === 'lg' ? 'text-2xl' : 'text-[1.05rem]';
  const box = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const colour = tone === 'dark' ? 'text-white' : 'text-ink';
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="SkillLens home">
      <svg viewBox="0 0 64 64" className={box} aria-hidden="true">
        <rect width="64" height="64" rx="20" fill="#d7282f" />
        <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" strokeWidth="5" />
        <circle cx="32" cy="32" r="5.5" fill="#fff" />
      </svg>
      <span className={`${text} ${colour} font-display ${compact ? 'hidden sm:inline' : ''}`}>SkillLens</span>
    </Link>
  );
}
