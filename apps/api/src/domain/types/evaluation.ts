export type ScoreRating = 'Excellent' | 'Good' | 'Needs Improvement' | 'Missing';

export interface CriterionScore {
  criterionId: string;
  title: string;
  score: number;
  maxScore: number;
  rating: ScoreRating;
  summary: string;
}

export type FeedbackType = 'strength' | 'concern' | 'suggestion';
export type FeedbackPriority = 'high' | 'medium' | 'low';

export interface FeedbackItem {
  id: string;
  criterionId: string;
  type: FeedbackType;
  title: string;
  evidence: string;
  impact: string;
  suggestion: string;
  priority: FeedbackPriority;
}

export interface ComparisonSummary {
  previousRevisionNumber: number;
  scoreDelta: number;
  resolvedConcerns: string[];
  unresolvedConcerns: string[];
  newConcerns: string[];
  summary: string;
}

export interface Evaluation {
  id: string;
  submissionId: string;
  overallScore: number;
  criterionScores: CriterionScore[];
  feedbackItems: FeedbackItem[];
  comparisonWithPrevious?: ComparisonSummary;
  engine: 'deterministic-v1' | 'llm-hybrid';
  evaluatedAt: string;
}
