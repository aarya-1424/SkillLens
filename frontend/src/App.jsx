import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import AppLayout from './layouts/AppLayout';
import RequireAuth from './components/RequireAuth';
import { ProfileReady, RequireProfile } from './components/RequireProfile';
import Setup from './pages/Setup';
import Legal from './pages/Legal';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Progress from './pages/Progress';
import Coach from './pages/Coach';
import PrivacyCenter from './pages/PrivacyCenter';
import Plan from './pages/Plan';
import Teams from './pages/Teams';
import TeamSquad from './pages/TeamSquad';
import TeamPlayer from './pages/TeamPlayer';
import JoinTeam from './pages/JoinTeam';
import Compare from './pages/Compare';

// Heavy (charts, PDF, video) — only loaded when someone starts an analysis.
const Analyze = lazy(() => import('./pages/Analyze'));

const Spinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/terms" element={<Legal kind="terms" />} />
      <Route path="/privacy" element={<Legal kind="privacy" />} />
      <Route
        path="/app/setup"
        element={
          <RequireAuth>
            <ProfileReady>
              <Setup />
            </ProfileReady>
          </RequireAuth>
        }
      />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <RequireProfile>
              <AppLayout />
            </RequireProfile>
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="progress" element={<Progress />} />
        <Route path="plan" element={<Plan />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/:teamId" element={<TeamSquad />} />
        <Route path="teams/:teamId/players/:athleteId" element={<TeamPlayer />} />
        <Route path="teams/:teamId/players/:athleteId/reports/:id" element={<ReportDetail />} />
        <Route path="join/:code" element={<JoinTeam />} />
        <Route path="compare" element={<Compare />} />
        <Route path="coach" element={<Coach />} />
        <Route path="privacy" element={<PrivacyCenter />} />
        <Route path="analyze" element={<Suspense fallback={<Spinner />}><Analyze /></Suspense>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
