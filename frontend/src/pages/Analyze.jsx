import { useSearchParams } from 'react-router-dom';
import AnalyzeFlow from '../features/analyze/AnalyzeFlow';
import { useProfile } from '../context/ProfileContext';
import { SPORTS } from '../data/landing';

export default function Analyze() {
  const [params] = useSearchParams();
  const { profile } = useProfile();
  // Start on the sport they asked for, else their main sport from setup.
  const mine = SPORTS.find((s) => s.slug === profile?.sport_slug)?.name;
  return <AnalyzeFlow initialSport={params.get('sport') || mine || undefined} />;
}
