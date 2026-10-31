import { useCallback, useEffect, useState } from 'react';
import { HomePage } from './HomePage';
import Analysing from './Analysing';
import Report from './Report';
import { WebcamRecorder } from '../../components/WebcamRecorder';
import { SPORTS } from '../../data/landing';

/**
 * The analysis flow: pick sport → record or upload → analysing → report.
 * Kept as one state machine so the video blob never has to survive a page change.
 */
export default function AnalyzeFlow({ initialSport }) {
  const [view, setView] = useState('home');
  const [videoUrl, setVideoUrl] = useState(null);
  const [sportName, setSportName] = useState(initialSport || 'Cricket');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const slug = (SPORTS.find((s) => s.name === sportName) || SPORTS[0]).slug;

  // Free the video blob when we are finished with it.
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const start = (url, name) => {
    setError('');
    setVideoUrl(url);
    setSportName(name);
    setView('analysing');
  };

  const handleDone = useCallback((result) => { setAnalysis(result); setView('report'); }, []);
  const handleError = useCallback((message) => { setError(message); setView('home'); }, []);

  const startOver = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setAnalysis(null);
    setError('');
    setView('home');
  };

  if (view === 'recorder') {
    return (
      <WebcamRecorder
        onRecordingComplete={(blob, url) => start(url, sportName)}
        onCancel={() => setView('home')}
      />
    );
  }

  if (view === 'analysing') {
    return (
      <Analysing
        videoUrl={videoUrl} slug={slug}
        onDone={handleDone} onError={handleError} onCancel={startOver}
      />
    );
  }

  if (view === 'report' && analysis) {
    return <Report analysis={analysis} videoUrl={videoUrl} onStartOver={startOver} />;
  }

  return (
    <>
      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        </div>
      )}
      <HomePage
        initialSport={sportName}
        onVideoSelect={(file, name) => start(URL.createObjectURL(file), name)}
        onRecordClick={(name) => { setSportName(name); setView('recorder'); }}
      />
    </>
  );
}
