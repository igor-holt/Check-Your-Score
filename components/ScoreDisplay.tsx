import React from 'react';
import type { ProductivityScore, ActionStep, CohortStanding, RubricScore } from '../types';
import { ShareIcon, CheckCircleIcon, XCircleIcon, LightBulbIcon, TrendingUpIcon, TableIcon } from './Icons';

interface ScoreDisplayProps {
  scoreData: ProductivityScore;
  username: string;
  timestamp: Date | null;
}

const SectionCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-gray-900/40 rounded-lg p-6 ${className}`}>
        <h3 className="font-semibold text-white mb-4 flex items-center text-lg">
            {icon} {title}
        </h3>
        {children}
    </div>
);

const BulletList: React.FC<{ items: string[]; icon: React.ReactNode }> = ({ items, icon }) => (
    <ul className="space-y-2">
        {items.map((item, i) => (
            <li key={i} className="flex items-start">
                <span className="mr-3 mt-1 flex-shrink-0">{icon}</span>
                <span className="text-gray-300">{item}</span>
            </li>
        ))}
    </ul>
);

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scoreData, username, timestamp }) => {
  const { 
    utilizationScore,
    percentileEstimates,
    inputsObserved,
    highLeverageBehaviors,
    missedLeverage,
    cohortComparison,
    whatMovesYou,
    minimalRubric,
    callToAction
  } = scoreData;
  
  const scoreColor = utilizationScore > 90 ? 'text-cyan-400' : utilizationScore > 80 ? 'text-green-400' : 'text-yellow-400';

  const handleShare = async () => {
    const shareData = {
      title: `My AI Productivity Score: ${username}`,
      text: `My AI utilization score is ${utilizationScore}/100! Here's how I can improve...`,
      url: 'https://score.genesisconductor.io',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Sharing is not supported on your browser. You can copy the URL to share.");
    }
  };

  return (
    <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-2xl shadow-gray-950/50 space-y-8">
      <button
        onClick={handleShare}
        aria-label="Share your score"
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/70 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <ShareIcon className="h-5 w-5 text-gray-300" />
      </button>

      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Productivity Utilization Report</h2>
        <p className="text-gray-400 mt-1">
            Generated for <span className="font-semibold text-cyan-400">{username}</span>
            {timestamp && <span className="block text-xs text-gray-500 mt-1">{timestamp.toLocaleString()}</span>}
        </p>
      </div>

      {/* Main Score and Percentiles */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-gray-900/40 p-6 rounded-lg">
          <div className="text-center">
              <p className="text-lg font-medium text-gray-400">Utilization Score</p>
              <p className={`text-8xl font-black my-2 ${scoreColor}`}>{utilizationScore}</p>
          </div>
          <div className="border-l-2 border-gray-700 pl-8">
              <p className="font-semibold text-white">Relative Standing (Percentile Estimates)</p>
              <p className="text-gray-300">{percentileEstimates}</p>
          </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionCard title={`Why ${utilizationScore}? The Breakdown`} icon={<LightBulbIcon className="mr-2 h-6 w-6"/>}>
          <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-gray-200 mb-2">High-Leverage Behaviors Present:</h4>
                <BulletList items={highLeverageBehaviors} icon={<CheckCircleIcon className="h-5 w-5 text-green-400" />} />
            </div>
            <div>
                <h4 className="font-semibold text-gray-200 mb-2">Missed Leverage (Your Opportunity):</h4>
                <BulletList items={missedLeverage} icon={<XCircleIcon className="h-5 w-5 text-yellow-400" />} />
            </div>
          </div>
        </SectionCard>
        
        <SectionCard title="Cohort Comparison" icon={<TableIcon className="mr-2 h-6 w-6"/>}>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2 font-semibold text-gray-300">Cohort</th>
                            <th className="p-2 font-semibold text-gray-300">Your Standing (est.)</th>
                            <th className="p-2 font-semibold text-gray-300">Why</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cohortComparison.map((c: CohortStanding, i: number) => (
                            <tr key={i} className="border-b border-gray-800">
                                <td className="p-2 font-medium text-white">{c.cohort}</td>
                                <td className="p-2 text-gray-300">{c.standing}</td>
                                <td className="p-2 text-gray-400 text-sm">{c.reason}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
      </div>

      {/* Actionable Steps */}
      <SectionCard title="What Moves You +10 Points Fast" icon={<TrendingUpIcon className="mr-2 h-6 w-6"/>} className="bg-gradient-to-br from-gray-900/40 to-cyan-900/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whatMovesYou.map((step: ActionStep, i: number) => (
                <div key={i}>
                    <h4 className="font-semibold text-cyan-300 mb-2">{step.title}</h4>
                    <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                        {step.points.map((point, j) => <li key={j}>{point}</li>)}
                    </ul>
                </div>
            ))}
        </div>
      </SectionCard>
      
      {/* Rubric and CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SectionCard title="Minimal Rubric Behind the Score" icon={<TableIcon className="mr-2 h-6 w-6"/>}>
            <ul className="space-y-2">
                {minimalRubric.map((r: RubricScore, i: number) => (
                    <li key={i} className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                        <span className="text-gray-300">{r.category}</span>
                        <span className="font-mono font-bold text-cyan-300">{r.score}/{r.maxScore}</span>
                    </li>
                ))}
            </ul>
        </SectionCard>
        <div className="flex items-center justify-center text-center bg-gray-900/40 p-6 rounded-lg">
            <p className="text-cyan-200 italic">{callToAction}</p>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;