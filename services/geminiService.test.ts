import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import the mockGenerateContent from the manual mock
import { mockGenerateContent } from '@google/genai';
import { fetchProductivityScore, fetchLeaderboards } from './geminiService';

// Tell Vitest to use the manual mock
vi.mock('@google/genai');

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('fetchProductivityScore', () => {
    const mockScore = {
      utilizationScore: 84,
      percentileEstimates: "All users ~98th, Paying subscribers ~90th, Developers/programmers ~70th.",
      inputsObserved: ["Broad use (coding, drafting, data)"],
      highLeverageBehaviors: ["Iterative prompts"],
      missedLeverage: ["Limited API/automation"],
      cohortComparison: [],
      whatMovesYou: [],
      minimalRubric: [],
      callToAction: "Let's build a plan.",
    };

    it('should return a valid productivity score and hash on success', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockScore),
      });

      const result = await fetchProductivityScore();

      expect(result).toEqual(expect.objectContaining(mockScore));
      expect(result.runHash).toMatch(/^[0-9a-f]{40}$/); // SHA-1 hash regex
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for malformed JSON responses', async () => {
        mockGenerateContent.mockResolvedValue({
        text: '{"utilizationScore": 84, malformed}',
      });

      await expect(fetchProductivityScore()).rejects.toThrow(
        'The AI returned a malformed response. Please try again.'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('should throw a generic error for other API failures', async () => {
        mockGenerateContent.mockRejectedValue(new Error('API is down'));

      await expect(fetchProductivityScore()).rejects.toThrow(
        'Failed to get a valid score from the AI model.'
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchLeaderboards', () => {
    const mockUserEntry = {
        runHash: 'testhash123',
        score: 84,
        isVerified: false,
    };

    it('should retrieve and correctly sort entries from localStorage', async () => {
      localStorage.setItem('userEntry', JSON.stringify(mockUserEntry));

      const { verified, unverified } = await fetchLeaderboards();

      expect(unverified).toHaveLength(1);
      expect(unverified[0]).toEqual(mockUserEntry);

      expect(verified).toHaveLength(0);
    });

    it('should handle the case with no data in localStorage', async () => {
      const { verified, unverified } = await fetchLeaderboards();
      expect(verified).toEqual([]);
      expect(unverified).toEqual([]);
    });

    it('should handle malformed data in localStorage gracefully', async () => {
      localStorage.setItem('userEntry', '{"score": 90, malformed}');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { verified, unverified } = await fetchLeaderboards();

      expect(verified).toEqual([]);
      expect(unverified).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to parse user entry for leaderboard simulation",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
