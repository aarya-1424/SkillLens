import React from 'react';
export const RiskBarChart = ({ injuryRisk, jointScores }) => {
    // Calculate risk percentage for each joint (inverse of score percentage)
    const calculateRiskPercentage = (score, max) => {
        const scorePercentage = (score / max) * 100;
        // Higher score = lower risk, so we invert it
        return Math.max(0, Math.min(100, 100 - scorePercentage));
    };
    const jointRisks = [
        {
            name: 'Shoulder',
            risk: calculateRiskPercentage(jointScores.shoulder.score, jointScores.shoulder.max),
            color: calculateRiskPercentage(jointScores.shoulder.score, jointScores.shoulder.max) > 50 ? 'bg-red-500' :
                calculateRiskPercentage(jointScores.shoulder.score, jointScores.shoulder.max) > 30 ? 'bg-yellow-500' : 'bg-green-500'
        },
        {
            name: 'Elbow',
            risk: calculateRiskPercentage(jointScores.elbow.score, jointScores.elbow.max),
            color: calculateRiskPercentage(jointScores.elbow.score, jointScores.elbow.max) > 50 ? 'bg-red-500' :
                calculateRiskPercentage(jointScores.elbow.score, jointScores.elbow.max) > 30 ? 'bg-yellow-500' : 'bg-green-500'
        },
        {
            name: 'Hip',
            risk: calculateRiskPercentage(jointScores.hip.score, jointScores.hip.max),
            color: calculateRiskPercentage(jointScores.hip.score, jointScores.hip.max) > 50 ? 'bg-red-500' :
                calculateRiskPercentage(jointScores.hip.score, jointScores.hip.max) > 30 ? 'bg-yellow-500' : 'bg-green-500'
        },
        {
            name: 'Spine',
            risk: calculateRiskPercentage(jointScores.spine.score, jointScores.spine.max),
            color: calculateRiskPercentage(jointScores.spine.score, jointScores.spine.max) > 50 ? 'bg-red-500' :
                calculateRiskPercentage(jointScores.spine.score, jointScores.spine.max) > 30 ? 'bg-yellow-500' : 'bg-green-500'
        }
    ];
    const riskLevelColors = {
        Low: 'border-green-500',
        Medium: 'border-yellow-500',
        High: 'border-red-500'
    };
    return (<div className={`bg-gray-800/50 p-6 rounded-2xl border ${riskLevelColors[injuryRisk.level]}`}>
      <h2 className="text-xl font-bold mb-4">Joint-Specific Risk Analysis</h2>
      
      <div className="space-y-4">
        {jointRisks.map((joint) => (<div key={joint.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-300">{joint.name}</span>
              <span className="text-sm font-semibold text-white">{Math.round(joint.risk)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className={`h-full ${joint.color} transition-all duration-1000 ease-out rounded-full`} style={{ width: `${joint.risk}%` }}>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>))}
      </div>

      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Overall Risk Level:</span>
          <span className={`text-lg font-bold ${injuryRisk.level === 'Low' ? 'text-green-400' :
            injuryRisk.level === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
            {injuryRisk.level}
          </span>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400 italic">
        * Risk percentages calculated from AI movement analysis comparing your performance with reference video
      </div>
    </div>);
};
