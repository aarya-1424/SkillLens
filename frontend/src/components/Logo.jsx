import { Link } from 'react-router-dom';

export default function Logo({ to = '/', size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : 'text-xl';
  return (
    <Link to={to} className="flex items-center gap-2 group" aria-label="SkillLens home">
      <img src="/favicon.svg" alt="" className={size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'} />
      <span className={`${text} font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500`}>
        SkillLens
      </span>
    </Link>
  );
}
