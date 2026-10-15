import { useCallback, useEffect, useState } from 'react';
import { HomePage } from './HomePage';
import { LoadingPage } from './LoadingPage';
import { ResultsPage } from './ResultsPage';
import { FitnessForm } from '../../components/FitnessForm';
import { WebcamRecorder } from '../../components/WebcamRecorder';

/**
 * The analysis flow: pick sport → record/upload → fitness form → analysing → report.
 * Kept as one state machine (from the hackathon app) so the video blob never has
 * to survive a page change.
 */
export default function AnalyzeFlow({ initialSport }) {
  const [view, setView] = useState('home');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [selectedSport, setSelectedSport] = useState(initialSport || 'Cricket');
  const [userFitnessData, setUserFitnessData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [progressData, setProgressData] = useState([]);

  // Free the video blob when leaving the page.
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const handleVideoSelect = (file, sport) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setSelectedSport(sport);
    setView('fitness-form');
  };

  const handleRecordClick = (sport) => {
    setSelectedSport(sport);
    setView('recorder');
  };

  const handleRecordingComplete = (videoBlob, url) => {
    setVideoFile(new File([videoBlob], `recording_${Date.now()}.webm`, { type: 'video/webm' }));
    setVideoUrl(url);
    setView('fitness-form');
  };

  const handleAnalysisComplete = useCallback((result) => {
    setAnalysisResult(result);
    setProgressData((prev) => [
      ...prev,
      {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total_score: result.totalScore,
        shoulder_score: result.jointScores.shoulder.score,
        elbow_score: result.jointScores.elbow.score,
        hip_score: result.jointScores.hip.score,
        spine_score: result.jointScores.spine.score,
      },
    ]);
    setView('results');
  }, []);

  const handleStartOver = () => {
    setVideoFile(null);
    setVideoUrl(null);
    setUserFitnessData(null);
    setAnalysisResult(null);
    setView('home');
  };

  switch (view) {
    case 'recorder':
      return <WebcamRecorder onRecordingComplete={handleRecordingComplete} onCancel={() => setView('home')} />;
    case 'fitness-form':
      return (
        <FitnessForm
          onSubmit={(data) => { setUserFitnessData(data); setView('loading'); }}
          onBack={() => setView('home')}
          preSelectedSport={selectedSport}
        />
      );
    case 'loading':
      return <LoadingPage onAnalysisComplete={handleAnalysisComplete} videoFile={videoFile} userFitnessData={userFitnessData} />;
    case 'results':
      if (analysisResult && videoUrl && userFitnessData) {
        return (
          <>
            <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 pt-6">
              <div className="px-4 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-200 text-sm">
                <strong>Preview:</strong> these scores are sample values. Real body tracking and scoring is being switched on next.
              </div>
            </div>
            <ResultsPage
              result={analysisResult}
              progressData={progressData}
              userVideoUrl={videoUrl}
              userFitnessData={userFitnessData}
              onStartOver={handleStartOver}
            />
          </>
        );
      }
      return <HomePage onVideoSelect={handleVideoSelect} onRecordClick={handleRecordClick} initialSport={selectedSport} />;
    default:
      return <HomePage onVideoSelect={handleVideoSelect} onRecordClick={handleRecordClick} initialSport={selectedSport} />;
  }
}
