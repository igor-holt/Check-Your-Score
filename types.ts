export interface CohortStanding {
  cohort: string;
  standing: string;
  reason: string;
}

export interface RubricScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface ActionStep {
    title: string;
    points: string[];
}

export interface ProductivityScore {
  runHash: string;
  utilizationScore: number;
  percentileEstimates: string;
  inputsObserved: string[];
  highLeverageBehaviors: string[];
  missedLeverage: string[];
  cohortComparison: CohortStanding[];
  whatMovesYou: ActionStep[];
  minimalRubric: RubricScore[];
  callToAction: string;
}

export interface LeaderboardEntry {
  runHash: string;
  username: string;
  score: number;
  isVerified: boolean;
}

export interface ScoreHistoryEntry {
  scoreData: ProductivityScore;
  timestamp: string; // ISO string for easy storage
}
