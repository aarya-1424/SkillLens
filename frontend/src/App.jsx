import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './components/RequireAuth';

// Heavy (charts, PDF, video) — only loaded when someone starts an analysis.
const Analyze = lazy(() => import('./pages/Analyze'));

const Spinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="analyze" element={<Suspense fallback={<Spinner />}><Analyze /></Suspense>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
