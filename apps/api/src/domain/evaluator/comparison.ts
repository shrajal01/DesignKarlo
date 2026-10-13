import type { Evaluation, ComparisonSummary } from '../types/evaluation';

export function compareEvaluations(
  currentEvaluation: Evaluation,
  previousEvaluation: Evaluation,
  previousRevisionNumber: number
): ComparisonSummary {
  const currentConcerns = currentEvaluation.feedbackItems.filter(
    (item) => item.type === 'concern'
  );
  const previousConcerns = previousEvaluation.feedbackItems.filter(
    (item) => item.type === 'concern'
  );

  const currentConcernTitles = new Set(currentConcerns.map((c) => c.title));
  const previousConcernTitles = new Set(previousConcerns.map((c) => c.title));

  const resolvedConcerns: string[] = [];
  const unresolvedConcerns: string[] = [];
  const newConcerns: string[] = [];

  for (const prev of previousConcerns) {
    if (currentConcernTitles.has(prev.title)) {
      unresolvedConcerns.push(prev.title);
    } else {
      resolvedConcerns.push(prev.title);
    }
  }

  for (const curr of currentConcerns) {
    if (!previousConcernTitles.has(curr.title)) {
      newConcerns.push(curr.title);
    }
  }

  const scoreDelta = currentEvaluation.overallScore - previousEvaluation.overallScore;

  let summary = '';
  if (resolvedConcerns.length > 0 && scoreDelta > 0) {
    summary = `Progress detected between Revision ${previousRevisionNumber} and current revision: score changed by +${scoreDelta} points. Resolved ${resolvedConcerns.length} design concern(s): ${resolvedConcerns.join(', ')}.`;
  } else if (scoreDelta < 0) {
    summary = `Score changed by ${scoreDelta} points compared to Revision ${previousRevisionNumber}. Introduced ${newConcerns.length} new concern(s): ${newConcerns.join(', ')}.`;
  } else if (resolvedConcerns.length > 0) {
    summary = `Resolved ${resolvedConcerns.length} concern(s) from Revision ${previousRevisionNumber}: ${resolvedConcerns.join(', ')}.`;
  } else if (unresolvedConcerns.length > 0) {
    summary = `Score unchanged. ${unresolvedConcerns.length} architectural concern(s) remain from Revision ${previousRevisionNumber}.`;
  } else {
    summary = `Both revisions maintained a clean architectural design. Score delta: ${scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}.`;
  }

  return {
    previousRevisionNumber,
    scoreDelta,
    resolvedConcerns,
    unresolvedConcerns,
    newConcerns,
    summary,
  };
}
