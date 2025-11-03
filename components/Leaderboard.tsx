
import React from 'react';
import type { LeaderboardEntry } from '../types';
import { VerifiedIcon } from './Icons';

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  isRanked: boolean;
  currentUserRunHash: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ title, entries, isRanked, currentUserRunHash }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-xl shadow-gray-950/50">
      <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No entries yet.</p>
        ) : (
          entries.map((entry, index) => {
            const isCurrentUser = entry.runHash === currentUserRunHash;
            const rank = isRanked ? index + 1 : null;
            
            const rankColor = rank === 1 ? 'text-yellow-300' : rank === 2 ? 'text-gray-300' : rank === 3 ? 'text-yellow-600' : 'text-gray-500';

            return (
              <div
                key={entry.runHash}
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ${isCurrentUser ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-gray-800'}`}
              >
                {isRanked && rank && (
                  <span className={`w-8 text-lg font-bold ${rankColor}`}>{rank}.</span>
                )}
                <div className="flex-grow flex items-center">
                  <span className="font-medium text-gray-200">{entry.username}</span>
                  {isCurrentUser && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-400 text-gray-900">
                      You
                    </span>
                  )}
                  {entry.isVerified && <VerifiedIcon className="h-5 w-5 text-cyan-400 ml-2" />}
                </div>
                <span className="text-lg font-bold text-white">{entry.score.toFixed(1)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboard;