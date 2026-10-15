import React from 'react';
export const ComparisonIndicator = ({ sport, totalScore, detectedErrors }) => {
    const accuracyPercentage = Math.round((totalScore / 100) * 100);
    return (<div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-xl font-bold text-white">AI Comparison Complete</h3>
        </div>
        <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <span className="text-yellow-300 font-semibold text-sm">Preview data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Reference Used</div>
          <div className="text-lg font-semibold text-white">{sport} Standard</div>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Match Accuracy</div>
          <div className="text-lg font-semibold text-teal-400">{accuracyPercentage}%</div>
        </div>
        
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Issues Detected</div>
          <div className={`text-lg font-semibold ${detectedErrors === 0 ? 'text-green-400' : detectedErrors <= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
            {detectedErrors} {detectedErrors === 1 ? 'Error' : 'Errors'}
          </div>
        </div>
      </div>

      <div className="flex items-start space-x-2 text-sm text-gray-300">
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>
          When real body tracking is switched on, your movement will be compared with correct {sport} technique, joint by joint. The numbers above are sample values for now.
        </p>
      </div>
    </div>);
};
