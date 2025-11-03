import { GoogleGenAI, Type } from "@google/genai";
import type { ProductivityScore, LeaderboardEntry } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const productivityScoreSchema = {
  type: Type.OBJECT,
  properties: {
    utilizationScore: { type: Type.NUMBER, description: "The main score from 0 to 100." },
    percentileEstimates: { type: Type.STRING, description: "A summary string of percentile estimates." },
    inputsObserved: { type: Type.ARRAY, items: { type: Type.STRING } },
    highLeverageBehaviors: { type: Type.ARRAY, items: { type: Type.STRING } },
    missedLeverage: { type: Type.ARRAY, items: { type: Type.STRING } },
    cohortComparison: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          cohort: { type: Type.STRING },
          standing: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["cohort", "standing", "reason"],
      },
    },
    whatMovesYou: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                points: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "points"],
        },
    },
    minimalRubric: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                score: { type: Type.NUMBER },
                maxScore: { type: Type.NUMBER },
            },
            required: ["category", "score", "maxScore"],
        }
    },
    callToAction: { type: Type.STRING },
  },
  required: ["utilizationScore", "percentileEstimates", "inputsObserved", "highLeverageBehaviors", "missedLeverage", "cohortComparison", "whatMovesYou", "minimalRubric", "callToAction"],
};


const PROMPT = `
You are an AI Productivity Utilization Analyst. Your purpose is to provide a detailed, actionable, and qualitative assessment of a user's AI utilization based on a hypothetical activity summary.

**CRITICAL INSTRUCTION: Adhere to the Persona and Format**
- You must generate a single JSON object that conforms *exactly* to the provided schema.
- Your tone should be that of an expert coach: insightful, encouraging, and concrete.
- The analysis should be for a hypothetical but realistic "power user" who is technically proficient but has clear areas for growth.
- Do not output markdown, explanations, or any text outside the JSON object.

**TASK: Generate a Productivity Utilization Report**

Based on the hypothetical activity of a user who demonstrates broad but not fully optimized use of AI tools, generate a report that follows the structure and spirit of the example below.

**Example and Template for your output:**

*   **Utilization Score:** A score around 84.
*   **Relative Standing:** Percentiles suggesting high rank among general users but lower among developers.
    *   Example: "All users ~98th, Paying subscribers ~90th, Developers/programmers ~70th."
*   **Why [Score]:**
    *   **Inputs Observed:** Mention broad use (coding, drafting, data), clear specs, team subscription, some tool use.
    *   **High-leverage Behaviors:** Note iterative prompts, context carry-forward.
    *   **Missed Leverage:** This is key. Mention limited API/automation, few custom tools (GPTs), no formal evals, sparse RAG, minimal batch processing.
*   **Cohort Comparison:** Create a table-like structure with cohorts (All users, Paying subscribers, Developers) and explain the user's standing in each.
*   **What moves you +10 points fast:** Provide actionable, grouped advice.
    *   \`Automate repeatables\`: Suggest API/Actions, batch runs.
    *   \`Own your retrieval layer\`: Suggest a central vector store.
    *   \`Package your workflows\`: Suggest custom tools/GPTs for specific tasks.
    *   \`Measure quality\`: Suggest golden sets, auto-grading.
    *   \`Library and reuse\`: Suggest prompt snippets, versioning.
    *   \`Team leverage\`: Suggest sharing assets, SOPs.
*   **Minimal rubric behind the score:** Provide a plausible breakdown of scores for categories like "Breadth of use", "Depth per task", "Tooling", "Automation", "Retrieval", "Measurement".
*   **Call to Action:** End with an offer to provide a more concrete plan.
    *   Example: "If you want, I can turn this into a concrete build plan with example API calls, a retrieval schema, and a starter eval set for one workflow."

Now, generate the complete JSON output.
`;

export const fetchProductivityScore = async (): Promise<ProductivityScore> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: PROMPT,
      config: {
        temperature: 0.5, // Allow for some creativity in wording
        responseMimeType: "application/json",
        responseSchema: productivityScoreSchema,
      },
    });
    
    const text = response.text.trim();
    // A simple SHA-1 hash to generate a unique ID for the leaderboard entry.
    // In a real app, a more robust hashing algorithm like SHA-256 from a crypto library would be used.
    const getSha1 = async (str: string) => {
        const textAsBuffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-1', textAsBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hash;
    }
    
    const data = JSON.parse(text);
    data.runHash = await getSha1(text); // Add a unique hash for leaderboard keying

    return data as ProductivityScore;
  } catch (error) {
    console.error("Error fetching or parsing productivity score:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned a malformed response. Please try again.");
    }
    throw new Error("Failed to get a valid score from the AI model.");
  }
};

export const fetchLeaderboards = async (): Promise<{ verified: LeaderboardEntry[], unverified: LeaderboardEntry[] }> => {
  // Simulate a network request to a backend
  await new Promise(resolve => setTimeout(resolve, 500));

  const verified: LeaderboardEntry[] = [];
  const unverified: LeaderboardEntry[] = [];

  // Simulate the backend having access to the current user's posted score
  try {
    const storedUserEntry = localStorage.getItem('userEntry');
    if (storedUserEntry) {
      const userEntry: LeaderboardEntry = JSON.parse(storedUserEntry);
      
      if (userEntry.isVerified) {
         if (!verified.some(e => e.runHash === userEntry.runHash)) {
            verified.push(userEntry);
         }
         // Remove from unverified if it exists there
         const index = unverified.findIndex(e => e.runHash === userEntry.runHash);
         if (index > -1) {
             unverified.splice(index, 1);
         }
      } else {
         if (!unverified.some(e => e.runHash === userEntry.runHash)) {
            unverified.unshift(userEntry);
         }
      }
    }
  } catch (e) {
    console.error("Failed to parse user entry for leaderboard simulation", e);
  }

  verified.sort((a, b) => b.score - a.score);

  return { verified, unverified };
};
