import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProductivityScore, fetchLeaderboards } from './services/geminiService';
import type { ProductivityScore, LeaderboardEntry, ScoreHistoryEntry } from './types';
import ScoreDisplay from './components/ScoreDisplay';
import Leaderboard from './components/Leaderboard';
import History from './components/History';
import Button from './components/Button';
import { LoadingSpinner, LogoIcon, RefreshIcon } from './components/Icons';
import MatrixBackground from './components/MatrixBackground';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasPosted, setHasPosted] = useState<boolean>(false);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [verifiedLeaderboard, setVerifiedLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [unverifiedLeaderboard, setUnverifiedLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const ESTIMATED_TIME = 20; // seconds

  const validateUsername = (name: string): string | null => {
      if (!name) return null; // Don't show error for empty input initially
      if (name.length < 3) return "Username must be at least 3 characters long.";
      if (name.length > 20) return "Username cannot exceed 20 characters.";
      if (!/^[a-zA-Z0-9_]+$/.test(name)) return "Username can only contain letters, numbers, and underscores.";
      return null;
  };

  const loadLeaderboards = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
        const { verified, unverified } = await fetchLeaderboards();
        setVerifiedLeaderboard(verified);
        setUnverifiedLeaderboard(unverified);
    } catch(e) {
        console.error("Failed to fetch leaderboards", e);
        let friendlyMessage = "An unexpected error occurred while loading the leaderboards.";
        if (e instanceof Error) {
            friendlyMessage = `Could not load leaderboards. A temporary network issue may have occurred. Please try refreshing.`;
        }
        setError(friendlyMessage);
    } finally {
        setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Load persistent state from localStorage on initial mount
    try {
      const storedHasPosted = localStorage.getItem('hasPosted');
      const storedUsername = localStorage.getItem('username');
      const storedHistory = localStorage.getItem('scoreHistory');
      const storedUserEntry = localStorage.getItem('userEntry');

      if (storedHistory) {
        const parsedHistory: ScoreHistoryEntry[] = JSON.parse(storedHistory);
        if (parsedHistory.length > 0) {
            setHistory(parsedHistory);
            setSelectedHistoryIndex(0); // Select the latest score by default
        }
      }
      if (storedUserEntry) setUserEntry(JSON.parse(storedUserEntry));

      if (storedHasPosted) {
          const posted = JSON.parse(storedHasPosted);
          setHasPosted(posted);
          if (posted) {
              loadLeaderboards(); 
          }
      }
      if (storedUsername) {
        setUsername(storedUsername);
        setUsernameError(validateUsername(storedUsername));
      }

    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    localStorage.setItem('username', newUsername);
    setUsernameError(validateUsername(newUsername));
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsLoading(false);
    setTimer(0);
    setError("Score generation cancelled.");
  };

  const handleLoadScore = async () => {
    if (!username.trim() || usernameError) {
        setError("Please enter a valid username to start.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setSelectedHistoryIndex(null); // Hide current score while generating new one
    setTimer(ESTIMATED_TIME);
    isCancelledRef.current = false;

    timerRef.current = window.setInterval(() => {
        setTimer(prev => {
            if (prev <= 1) {
                if(timerRef.current) clearInterval(timerRef.current);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    try {
      const data: ProductivityScore = await fetchProductivityScore();

      if (isCancelledRef.current) {
        return; // Operation was cancelled, do nothing.
      }
      
      const now = new Date();
      const newHistoryEntry: ScoreHistoryEntry = {
        scoreData: data,
        timestamp: now.toISOString(),
      };
      const updatedHistory = [newHistoryEntry, ...history];
      setHistory(updatedHistory);
      setSelectedHistoryIndex(0); // View the new score
      localStorage.setItem('scoreHistory', JSON.stringify(updatedHistory));

      const newEntry: LeaderboardEntry = {
        runHash: data.runHash,
        username: username.trim(),
        score: data.utilizationScore,
        isVerified: false,
      };
      setUserEntry(newEntry);
      
      // Persist user entry for posting
      localStorage.setItem('userEntry', JSON.stringify(newEntry));

    } catch (e) {
      if (isCancelledRef.current) {
        return; // Operation was cancelled, ignore error.
      }
      console.error("Score generation failed:", e);
      let friendlyMessage = "An unexpected error occurred while generating your score. Please try again later.";
      if (e instanceof Error) {
        // Provide more specific feedback based on potential error messages from the service.
        if (e.message.toLowerCase().includes('api key')) {
          friendlyMessage = "Failed to generate score. Please check that your API Key is valid and has sufficient quota.";
        } else if (e.message.toLowerCase().includes('malformed') || e.message.toLowerCase().includes('empty response')) {
          friendlyMessage = "The AI returned an invalid response. This may be a temporary issue. Please try again in a moment.";
        } else {
            friendlyMessage = "Failed to generate score. There might be a network issue or the service is temporarily down.";
        }
      }
      setError(friendlyMessage);
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsLoading(false);
    }
  };

  const persistState = useCallback((key: string, value: any) => {
      try {
          localStorage.setItem(key, JSON.stringify(value));
      } catch(e) {
          console.error(`Failed to persist ${key}`, e);
      }
  }, []);

  const handlePostUnverified = async () => {
    if (!userEntry) return;
    setHasPosted(true);
    persistState('hasPosted', true);
    await loadLeaderboards();
  };

  const handleGetVerified = async () => {
    if (!userEntry) return;

    // Simulate the API call succeeding by updating the local user entry first.
    // The next call to fetchLeaderboards will reflect this change.
    const verifiedEntry = { ...userEntry, isVerified: true };
    setUserEntry(verifiedEntry);
    persistState('userEntry', verifiedEntry);
    
    if (!hasPosted) {
        setHasPosted(true);
        persistState('hasPosted', true);
    }

    await loadLeaderboards();
  };

  const handleSelectHistory = (index: number) => {
    setSelectedHistoryIndex(index);
  };

  const currentScoreEntry = selectedHistoryIndex !== null ? history[selectedHistoryIndex] : null;
  const displayedScoreData = currentScoreEntry?.scoreData;
  const displayedTimestamp = currentScoreEntry ? new Date(currentScoreEntry.timestamp) : null;

  return (
    <>
      <MatrixBackground />
      <div className="relative z-10 min-h-screen text-gray-200 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <LogoIcon className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">AI Productivity Score</h1>
            </div>
          </header>

          <main>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8 shadow-2xl shadow-gray-950/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Your P-Score Report</h2>
                  <p className="text-gray-400 mt-1">Enter a username, generate your score, and post to the public feed.</p>
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto flex-shrink-0">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full flex-grow">
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="Enter your username"
                        aria-label="Username"
                        aria-invalid={!!usernameError}
                        aria-describedby="username-error"
                        className={`bg-gray-900 border ${usernameError ? 'border-red-500 ring-red-500' : 'border-gray-600'} rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full`}
                      />
                      {usernameError && <p id="username-error" className="text-red-400 text-sm mt-1 px-1">{usernameError}</p>}
                    </div>
                    <Button onClick={handleLoadScore} disabled={isLoading || isRefreshing || !username.trim() || !!usernameError} variant="primary" className="w-full sm:w-auto">
                      {isLoading ? <><LoadingSpinner className="mr-2" /> Generating...</> : "Load My Score"}
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handlePostUnverified} disabled={!userEntry || hasPosted || isLoading || isRefreshing} variant="secondary" className="flex-1">Post Unverified</Button>
                    <Button onClick={handleGetVerified} disabled={!userEntry || (userEntry?.isVerified ?? false) || isLoading || isRefreshing} variant="secondary" className="bg-cyan-500 hover:bg-cyan-400 text-white flex-1">Get Verified Rank</Button>
                  </div>
                </div>
              </div>
              
              {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
            </div>

            <div className="transition-opacity duration-500 ease-in-out">
              {isLoading ? (
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-2xl shadow-gray-950/50 min-h-[300px] flex flex-col items-center justify-center text-center">
                  <LoadingSpinner className="h-12 w-12 text-cyan-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white">Generating Your Utilization Report...</h3>
                  <p className="text-gray-400 mt-1">The AI is analyzing the data. This may take a moment.</p>
                  <div className="mt-6 w-full max-w-sm text-center">
                      <p className="text-lg text-white">
                          Estimated time remaining: <span className="font-bold">{timer}s</span>
                      </p>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                          <div 
                              className="bg-cyan-400 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                              style={{ width: `${((ESTIMATED_TIME - timer) / ESTIMATED_TIME) * 100}%` }}>
                          </div>
                      </div>
                  </div>
                  <Button onClick={handleCancel} variant="secondary" className="mt-8 bg-red-600 hover:bg-red-500 focus:ring-red-500 text-white">
                      Cancel Generation
                  </Button>
                </div>
              ) : displayedScoreData ? (
                <ScoreDisplay scoreData={displayedScoreData} username={username} timestamp={displayedTimestamp} />
              ) : null}
            </div>

            {history.length > 0 && !isLoading && (
              <div className="mt-8">
                  <History history={history} selectedIndex={selectedHistoryIndex} onSelect={handleSelectHistory} />
              </div>
            )}
            
            <div className={`transition-all duration-700 ease-in-out ${hasPosted ? 'opacity-100 max-h-[2000px] mt-8' : 'opacity-0 max-h-0 overflow-hidden'}`}>
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Leaderboards</h2>
                  <Button onClick={loadLeaderboards} disabled={isRefreshing} variant="secondary">
                      {isRefreshing ? <><LoadingSpinner className="mr-2" /> Refreshing...</> : <><RefreshIcon className="mr-2 h-4 w-4" /> Refresh</>}
                  </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Leaderboard title="Verified Leaderboard (Ranked)" entries={verifiedLeaderboard} isRanked={true} currentUserRunHash={userEntry?.runHash} />
                <Leaderboard title="Unverified Submissions" entries={unverifiedLeaderboard} isRanked={false} currentUserRunHash={userEntry?.runHash} />
              </div>
            </div>
            
            {!hasPosted && !isLoading && (
               <div className="text-center py-16 px-6 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl mt-8">
                  <h3 className="text-lg font-medium text-gray-300">Leaderboards are hidden</h3>
                  <p className="text-gray-400 mt-2">Post your score to view the full leaderboards and see where you stand.</p>
               </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
