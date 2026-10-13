import type { StructuredDesign } from '../schemas/submission';
import type { Evaluation, ComparisonSummary } from '../types/evaluation';
import type { Problem } from '../types/problem';

export interface EvaluationOptions {
  submissionId: string;
  previousEvaluation?: Evaluation;
  previousRevisionNumber?: number;
}

export interface IEvaluationEngine {
  readonly engineName: string;
  evaluate(
    design: StructuredDesign,
    problem: Problem,
    options: EvaluationOptions
  ): Promise<Evaluation> | Evaluation;
  compareRevisions(
    currentEvaluation: Evaluation,
    previousEvaluation: Evaluation,
    previousRevisionNumber: number
  ): ComparisonSummary;
}
