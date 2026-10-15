import { useSearchParams } from 'react-router-dom';
import AnalyzeFlow from '../features/analyze/AnalyzeFlow';

export default function Analyze() {
  const [params] = useSearchParams();
  return <AnalyzeFlow initialSport={params.get('sport') || undefined} />;
}
