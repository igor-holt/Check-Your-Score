import React from 'react';
import type { ScoreHistoryEntry } from '../types';
import { HistoryIcon } from './Icons';

interface HistoryProps {
  history: ScoreHistoryEntry[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const History: React.FC<HistoryProps> = ({ history, selectedIndex, onSelect }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-xl shadow-gray-950/50">
      <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
        <HistoryIcon className="mr-2 h-6 w-6" /> Score History
      </h2>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No past scores found.</p>
        ) : (
          history.map((entry, index) => (
            <button
              key={entry.scoreData.runHash}
              onClick={() => onSelect(index)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-300 ${selectedIndex === index ? 'bg-cyan-500/20 border border-cyan-500' : 'bg-gray-800 hover:bg-gray-700'}`}
              aria-pressed={selectedIndex === index}
            >
              <div>
                <p className="font-medium text-gray-200">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
                {selectedIndex === index && (
                    <span className="mt-1 text-xs font-bold rounded-full text-cyan-300">
                      Currently Viewing
                    </span>
                )}
              </div>
              <span className="text-lg font-bold text-white">{entry.scoreData.utilizationScore.toFixed(1)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
