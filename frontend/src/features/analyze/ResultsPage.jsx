import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ScoreDonut } from '../../components/ScoreDonut';
import { ScoreBreakdown } from '../../components/ScoreBreakdown';
import { FeedbackPanel } from '../../components/FeedbackPanel';
import { ProgressChart } from '../../components/ProgressChart';
import { VideoPlayer } from '../../components/VideoPlayer';
import { InjuryRiskPanel } from '../../components/InjuryRiskPanel';
import { RiskBarChart } from '../../components/RiskBarChart';
import { TrainingPlanPanel } from '../../components/TrainingPlanPanel';
import { ComparisonIndicator } from '../../components/ComparisonIndicator';
export const ResultsPage = ({ result, progressData, userVideoUrl, userFitnessData, onStartOver, }) => {
    const [userName, setUserName] = React.useState('');
    const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
    // Debug logging
    React.useEffect(() => {
        console.log('ResultsPage rendered with:');
        console.log('- User video URL:', userVideoUrl);
        console.log('- User video URL type:', typeof userVideoUrl);
        console.log('- User video URL length:', userVideoUrl?.length);
        console.log('- Reference video:', result.selectedReferenceVideo);
        console.log('- Sport:', userFitnessData.sport);
        // Test if blob URL is still valid
        if (userVideoUrl && userVideoUrl.startsWith('blob:')) {
            console.log('Blob URL detected, attempting to validate...');
            fetch(userVideoUrl)
                .then(response => console.log('Blob URL is valid, size:', response.headers.get('content-length')))
                .catch(error => console.error('Blob URL is INVALID:', error));
        }
    }, [userVideoUrl, result.selectedReferenceVideo, userFitnessData.sport]);
    const handleDownloadReport = async () => {
        setIsGeneratingReport(true);
        const reportElement = document.getElementById('printable-content');
        if (!reportElement) {
            setIsGeneratingReport(false);
            return;
        }
        // Temporarily show the print-only header for capture
        const printHeader = document.getElementById('print-only-header');
        if (printHeader)
            printHeader.style.display = 'block';
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            backgroundColor: '#111827', // bg-gray-900
            onclone: (clonedDoc) => {
                // ✅ Fix 1: Explicitly cast NodeList to HTMLVideoElement[]
                const videoElements = Array.from(clonedDoc.querySelectorAll('video'));
                // ✅ Fix 2: Now TypeScript knows these are HTMLVideoElements
                videoElements.forEach((video) => {
                    const canvasEl = document.createElement('canvas');
                    canvasEl.width = video.clientWidth;
                    canvasEl.height = video.clientHeight;
                    const context = canvasEl.getContext('2d');
                    if (context) {
                        context.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);
                    }
                    video.parentNode?.replaceChild(canvasEl, video);
                });
            },
        });
        // Hide the print-only header again
        if (printHeader)
            printHeader.style.display = 'none';
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        const fileName = userName
            ? `SkillLens_Report_${userName.replace(/\s/g, '_')}.pdf`
            : 'SkillLens_Report.pdf';
        pdf.save(fileName);
        setIsGeneratingReport(false);
    };
    return (<div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* ---------- Header ---------- */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 no-print">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-500 mb-4 sm:mb-0">
          Analysis Report
        </h1>
        <div className="flex items-center space-x-4">
          <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter Name for Report" aria-label="Enter your name for the report" className="px-4 py-2.5 text-sm w-48 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:outline-none transition-all"/>
          <button onClick={handleDownloadReport} disabled={isGeneratingReport} className="px-5 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-800 disabled:cursor-not-allowed">
            {isGeneratingReport ? 'Generating...' : 'Download Report'}
          </button>
          <button onClick={onStartOver} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
            Analyze Another
          </button>
        </div>
      </header>

      <p className="text-center text-sm text-gray-400 mb-6 no-print">
        <strong>Tip:</strong> For the report, pause your video on a key frame to include it as a
        'screenshot'.
      </p>

      {/* ---------- Main Content ---------- */}
      <div id="printable-content" className="max-w-7xl mx-auto printable-content">
        {/* Print header (for PDF only) */}
        <div id="print-only-header" className="hidden mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">SkillLens Analysis Report</h1>
          <p className="text-lg text-white">
            <strong>Athlete:</strong> {userName || 'N/A'}
          </p>
          <p className="text-lg text-white">
            <strong>Sport:</strong> {userFitnessData.sport}
          </p>
          <p className="text-lg text-white">
            <strong>Experience Level:</strong> {userFitnessData.sportExperience}
          </p>
          <p className="text-lg text-white">
            <strong>Date:</strong>{' '}
            {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}
          </p>
          <hr className="my-4 border-gray-600"/>
        </div>

        {/* AI Comparison Indicator - Shows analysis is based on actual comparison */}
        <ComparisonIndicator sport={userFitnessData.sport} totalScore={result.totalScore} detectedErrors={result.detectedMovementErrors.length}/>

        {/* Sport and Movement Analysis Info */}
        <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/30 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-3">
            Analysis Summary: {userFitnessData.sport}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Experience:</span>{' '}
              <span className="text-white font-semibold capitalize">{userFitnessData.sportExperience}</span>
            </div>
            <div>
              <span className="text-gray-400">Stamina Level:</span>{' '}
              <span className="text-white font-semibold capitalize">{userFitnessData.stamina}</span>
            </div>
            <div>
              <span className="text-gray-400">Movement Errors Detected:</span>{' '}
              <span className="text-white font-semibold">{result.detectedMovementErrors.length}</span>
            </div>
          </div>
          
          {result.detectedMovementErrors.length > 0 && (<div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-red-300 mb-2">⚠️ Movement Errors Detected:</h3>
              <ul className="space-y-1">
                {result.detectedMovementErrors.map((error, index) => (<li key={index} className="text-sm text-red-200">• {error}</li>))}
              </ul>
            </div>)}
        </div>

        {/* Performance Score Header - Large and Prominent */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-8 mb-8">
          <h2 className="text-gray-400 text-lg mb-3">Overall Performance Score</h2>
          <div className="flex items-end gap-6">
            <div>
              <div className="text-6xl font-bold text-green-400">{result.totalScore.toFixed(1)}</div>
              <div className="text-gray-400 text-sm mt-1">out of 100</div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full" style={{ width: `${Math.min(result.totalScore, 100)}%` }}/>
              </div>
              <p className="text-gray-400 text-sm">
                {result.totalScore >= 80 ? '🌟 Excellent Performance!' :
            result.totalScore >= 60 ? '👍 Good Performance' :
                result.totalScore >= 40 ? '⚙️ Needs Improvement' : '💪 Keep Training'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print-grid">
          {/* ---------- Left Column (Videos + Feedback + Progress) ---------- */}
          <div className="lg:col-span-2 space-y-8 print-col-span-2">
            {/* Your video + reference video */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User video - with skeleton overlay */}
              <div>
                <VideoPlayer title="Your Performance" videoUrls={userVideoUrl ? [userVideoUrl] : []} showSkeleton={true}/>
                {!userVideoUrl && (<p className="text-xs text-red-400 mt-2">⚠️ Video URL missing. Please try uploading/recording again.</p>)}
              </div>

              {/* Reference video - No skeleton overlay */}
              <div>
                <VideoPlayer title={`${userFitnessData.sport} Reference (Demo)`} videoUrls={[result.selectedReferenceVideo]} showSkeleton={false} autoPlay={true}/>
                <p className="text-xs text-gray-500 mt-2 italic">
                  * Demo reference video. In production, sport-specific reference videos will be used for comparison.
                </p>
              </div>
            </div>

            {/* AI-Generated Feedback */}
            <FeedbackPanel feedback={result.feedback}/>

            {/* AI Injury Risk Analysis with Bar Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-page-break">
              <InjuryRiskPanel injuryRisk={result.injuryRisk}/>
              <RiskBarChart injuryRisk={result.injuryRisk} jointScores={result.jointScores}/>
            </div>

            {/* Progress Chart */}
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 no-print">
              <h2 className="text-xl font-bold mb-4">Your Progress Over Time</h2>
              <ProgressChart data={progressData}/>
            </div>

            {/* Training plan */}
            <TrainingPlanPanel trainingPlan={result.trainingPlan}/>
          </div>

          {/* ---------- Right Column (Scores) ---------- */}
          <div className="space-y-8">
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-center">Technique Score</h2>
              <ScoreDonut score={result.totalScore} maxScore={100}/>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-center">Fitness Potential</h2>
              <ScoreDonut score={result.fitnessPotential} maxScore={100} colorPreset="blue"/>
            </div>

            <ScoreBreakdown jointScores={result.jointScores}/>
          </div>
        </div>
      </div>
    </div>);
};
