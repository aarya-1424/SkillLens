import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500">404</div>
      <p className="text-gray-400">This page does not exist.</p>
      <Link to="/" className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20">Go home</Link>
    </div>
  );
}
