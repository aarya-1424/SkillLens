import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-canvas">
    <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Waits until we know whether the questionnaire has been filled in. */
export function ProfileReady({ children }) {
  const { status } = useProfile();
  if (status === 'idle' || status === 'loading') return <Spinner />;
  return children;
}

/**
 * Signed-in athletes fill in the questionnaire before using the app: it
 * carries their consent (and a parent's, for under-18s) as well as what
 * makes the advice fit them. Demo visitors can skip it.
 *
 * If our server cannot be reached we let them in rather than lock them out.
 */
export function RequireProfile({ children }) {
  const { guest } = useAuth();
  const { profile, status } = useProfile();
  if (status === 'idle' || status === 'loading') return <Spinner />;
  if (status === 'ready' && !profile && !guest) return <Navigate to="/app/setup" replace />;
  return children;
}
