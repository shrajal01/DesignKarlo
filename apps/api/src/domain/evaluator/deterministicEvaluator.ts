import type { StructuredDesign } from '../schemas/submission';
import type { Evaluation, ComparisonSummary } from '../types/evaluation';
import type { Problem } from '../types/problem';
import type { IEvaluationEngine, EvaluationOptions } from './types';
import { evaluateDomainEntities } from './criteria/domainEntities';
import { evaluateSolidModularity } from './criteria/solidModularity';
import { evaluateExtensibilityPatterns } from './criteria/extensibilityPatterns';
import { evaluateEdgeCasesConcurrency } from './criteria/edgeCasesConcurrency';
import { compareEvaluations } from './comparison';

export class DeterministicEvaluator implements IEvaluationEngine {
  public readonly engineName = 'deterministic-v1';

  public evaluate(
    design: StructuredDesign,
    problem: Problem,
    options: EvaluationOptions
  ): Evaluation {
    // 1. Evaluate all 4 rubric criteria
    const c1 = evaluateDomainEntities(design);
    const c2 = evaluateSolidModularity(design);
    const c3 = evaluateExtensibilityPatterns(design);
    const c4 = evaluateEdgeCasesConcurrency(design);

    const criterionScores = [c1.score, c2.score, c3.score, c4.score];
    const rawScore = criterionScores.reduce((sum, c) => sum + c.score, 0);
    const overallScore = Math.min(100, Math.max(0, rawScore));

    const feedbackItems = [
      ...c1.feedback,
      ...c2.feedback,
      ...c3.feedback,
      ...c4.feedback,
    ];

    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const evaluation: Evaluation = {
      id: evaluationId,
      submissionId: options.submissionId,
      overallScore,
      criterionScores,
      feedbackItems,
      engine: 'deterministic-v1',
      evaluatedAt: new Date().toISOString(),
    };

    // 2. If previous evaluation is provided, perform multi-attempt progression comparison
    if (options.previousEvaluation && options.previousRevisionNumber !== undefined) {
      evaluation.comparisonWithPrevious = this.compareRevisions(
        evaluation,
        options.previousEvaluation,
        options.previousRevisionNumber
      );
    }

    return evaluation;
  }

  public compareRevisions(
    currentEvaluation: Evaluation,
    previousEvaluation: Evaluation,
    previousRevisionNumber: number
  ): ComparisonSummary {
    return compareEvaluations(
      currentEvaluation,
      previousEvaluation,
      previousRevisionNumber
    );
  }
}

export const deterministicEvaluator = new DeterministicEvaluator();
