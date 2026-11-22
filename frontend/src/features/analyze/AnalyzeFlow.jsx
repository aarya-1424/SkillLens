import { useCallback, useEffect, useState } from 'react';
import { HomePage } from './HomePage';
import CheckVideo from './CheckVideo';
import Analysing from './Analysing';
import Report from './Report';
import { WebcamRecorder } from '../../components/WebcamRecorder';
import { SPORTS } from '../../data/landing';

/**
 * The analysis flow:
 *   pick sport → record or upload → check the clip → analysing → report.
 * Kept as one state machine so the video blob never has to survive a page change.
 */
export default function AnalyzeFlow({ initialSport }) {
  const [view, setView] = useState('home');
  const [clip, setClip] = useState(null); // { url, source, knownDuration, start, length }
  const [sportName, setSportName] = useState(initialSport || 'Cricket');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const sport = SPORTS.find((s) => s.name === sportName) || SPORTS[0];
  const videoUrl = clip?.url;

  // Free the video blob when we are finished with it.
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const check = (url, name, source, knownDuration) => {
    setError('');
    setSportName(name);
    setClip({ url, source, knownDuration });
    setView('check');
  };

  const handleDone = useCallback((result) => { setAnalysis(result); setView('report'); }, []);
  const handleError = useCallback((message) => { setError(message); setView('home'); }, []);

  const startOver = () => {
    setClip(null);
    setAnalysis(null);
    setError('');
    setView('home');
  };

  if (view === 'recorder') {
    return (
      <WebcamRecorder
        sport={sport}
        onRecordingComplete={(blob, url, seconds) => check(url, sportName, 'record', seconds)}
        onCancel={() => setView('home')}
      />
    );
  }

  if (view === 'check' && clip) {
    return (
      <CheckVideo
        sport={sport} videoUrl={clip.url} knownDuration={clip.knownDuration} source={clip.source}
        onAnalyse={({ start, length }) => { setClip({ ...clip, start, length }); setView('analysing'); }}
        onBack={() => { setClip(null); setView(clip.source === 'record' ? 'recorder' : 'home'); }}
      />
    );
  }

  if (view === 'analysing' && clip) {
    return (
      <Analysing
        videoUrl={clip.url} slug={sport.slug} start={clip.start} length={clip.length}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <div className="px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">
            {error}
          </div>
        </div>
      )}
      <HomePage
        initialSport={sportName}
        onVideoSelect={(file, name) => check(URL.createObjectURL(file), name, 'upload')}
        onRecordClick={(name) => { setSportName(name); setView('recorder'); }}
        onError={setError}
      />
    </>
  );
}
