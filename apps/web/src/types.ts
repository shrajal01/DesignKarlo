export type EntityType = 'class' | 'interface' | 'abstract_class' | 'enum';
export type RelationshipType =
  | 'has_a'
  | 'has_many'
  | 'inherits'
  | 'implements'
  | 'uses'
  | 'aggregates'
  | 'composes';

export interface EntityDefinition {
  name: string;
  type: EntityType;
  responsibilities: string[];
  attributes: string[];
  methods: string[];
}

export interface RelationshipDefinition {
  source: string;
  target: string;
  type: RelationshipType;
  description?: string;
}

export interface DesignPatternUsage {
  patternName: string;
  targetEntity: string;
  justification: string;
}

export interface StructuredDesign {
  problemSlug: string;
  assumptions: string[];
  entities: EntityDefinition[];
  relationships: RelationshipDefinition[];
  designPatterns: DesignPatternUsage[];
  edgeCasesConsidered: string[];
}

export interface RubricCriterion {
  id: string;
  title: string;
  weight: number;
  description: string;
  targetConcepts: string[];
}

export interface Rubric {
  id: string;
  totalWeight: number;
  criteria: RubricCriterion[];
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  summary: string;
  description: string;
  functionalRequirements: string[];
  nonFunctionalConstraints: string[];
  rubric: Rubric;
  starterTemplate: StructuredDesign;
  sampleSolution: StructuredDesign;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  summary: string;
  rubricDimensions: Array<{
    id: string;
    title: string;
    weight: number;
  }>;
}

export type ScoreRating = 'Excellent' | 'Good' | 'Needs Improvement' | 'Missing';
export type FeedbackType = 'strength' | 'concern' | 'suggestion';
export type FeedbackPriority = 'high' | 'medium' | 'low';

export interface CriterionScore {
  criterionId: string;
  title: string;
  score: number;
  maxScore: number;
  rating: ScoreRating;
  summary: string;
}

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

export interface Submission {
  id: string;
  attemptId: string;
  revisionNumber: number;
  design: StructuredDesign;
  evaluation?: Evaluation;
  parentSubmissionId?: string;
  submittedAt: string;
}

export interface Attempt {
  id: string;
  problemSlug: string;
  anonymousUserId: string;
  status: 'in_progress' | 'completed';
  currentRevisionNumber: number;
  createdAt: string;
  updatedAt: string;
  submissions?: Submission[];
}
