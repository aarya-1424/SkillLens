import React, { useEffect, useState } from 'react';
import { analyzeVideo } from '../../services/mockApiService';
const loadingMessages = [
    'Initializing AI analysis engine...',
    'Processing video frames...',
    'Detecting body landmarks with pose estimation...',
    'Comparing with reference performance...',
    'Calculating joint angles and deviations...',
    'Analyzing movement patterns for errors...',
    'Assessing injury risks based on detected movements...',
    'Generating personalized training recommendations...',
    'Creating customized diet plan...',
    'Finalizing your comprehensive performance report...',
];
export const LoadingPage = ({ onAnalysisComplete, videoFile, userFitnessData }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex(prevIndex => {
                if (prevIndex < loadingMessages.length - 1) {
                    return prevIndex + 1;
                }
                return prevIndex;
            });
        }, 800);
        const performAnalysis = async () => {
            try {
                if (!userFitnessData) {
                    console.error('No user fitness data provided');
                    return;
                }
                const result = await analyzeVideo(videoFile, userFitnessData);
                clearInterval(interval);
                onAnalysisComplete(result);
            }
            catch (error) {
                console.error("Analysis failed:", error);
                clearInterval(interval);
                // Handle error appropriately
            }
        };
        performAnalysis();
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoFile, userFitnessData, onAnalysisComplete]);
    return (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-20 h-20 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-8"></div>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">AI Analysis in Progress</h2>
      <p className="text-lg text-gray-300 transition-opacity duration-500 text-center max-w-md">
        {loadingMessages[currentMessageIndex]}
      </p>
      <div className="mt-8 w-full max-w-md bg-gray-800 rounded-full h-2">
        <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${((currentMessageIndex + 1) / loadingMessages.length) * 100}%` }}></div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        This may take 10-20 seconds for accurate AI analysis
      </p>
    </div>);
};
