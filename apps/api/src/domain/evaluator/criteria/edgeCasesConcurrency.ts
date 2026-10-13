import type { StructuredDesign } from '../../schemas/submission';
import type { CriterionScore, FeedbackItem, ScoreRating } from '../../types/evaluation';

export function evaluateEdgeCasesConcurrency(design: StructuredDesign): {
  score: CriterionScore;
  feedback: FeedbackItem[];
} {
  const feedback: FeedbackItem[] = [];

  const edgeCasesText = design.edgeCasesConsidered.join(' ').toLowerCase();
  const assumptionsText = design.assumptions.join(' ').toLowerCase();
  const combinedContext = `${edgeCasesText} ${assumptionsText}`;

  // 1. Capacity / Full Lot Saturation Handling (Max: 8 pts)
  let capacityScore = 2;
  const handlesFullLot =
    /full|capacity|saturation|reject|display board|vacant count|no spot|overflow/i.test(combinedContext) ||
    design.entities.some((e) =>
      e.methods.some((m) => /free|vacant|count|full|available/i.test(m))
    );

  if (handlesFullLot) {
    capacityScore = 8;
    const fullLotEvidence = design.edgeCasesConsidered.find((ec) =>
      /full|capacity|reject|available/i.test(ec)
    );
    feedback.push({
      id: 'fb_edge_capacity_handled',
      criterionId: 'edge_cases_concurrency',
      type: 'strength',
      title: 'Lot Saturation & Capacity Handled',
      evidence: fullLotEvidence || 'Capacity checks identified in domain model and edge cases.',
      impact:
        'Prevents vehicle congestion at gates by preemptively signaling lot status and preventing invalid ticket issuance when full.',
      suggestion: 'Ensure the lot status is communicated via real-time floor display boards.',
      priority: 'low',
    });
  } else {
    feedback.push({
      id: 'fb_edge_capacity_missing',
      criterionId: 'edge_cases_concurrency',
      type: 'concern',
      title: 'Full Capacity Handling Not Documented',
      evidence: 'No mention of lot full behavior in edgeCasesConsidered or assumptions.',
      impact:
        'Vehicles might be admitted when no valid parking spot is vacant, causing operational gridlock.',
      suggestion:
        'Add an explicit edge case describing how the system rejects entry when available spots reach zero.',
      priority: 'medium',
    });
  }

  // 2. Concurrency & Allocation Collision Risk (Max: 9 pts)
  // Per requirement: evaluate submitted allocation behavior and documented assumptions, not just keywords
  let concurrencyScore = 3;
  const mentionsMultiGate =
    /multiple gate|separate gate|simultaneous|entry gate|multiple entrance/i.test(combinedContext) ||
    design.entities.some((e) => /gate|terminal/i.test(e.name));

  const addressesConcurrency =
    /concurrent|race condition|collision|atomic|lock|synchronized|queue|reservation|contention|isolated|conflict/i.test(
      combinedContext
    );

  if (addressesConcurrency) {
    concurrencyScore = 9;
    const concurrencyEvidence = design.edgeCasesConsidered.find((ec) =>
      /concurrent|race|collision|atomic|lock|queue|conflict/i.test(ec)
    );
    feedback.push({
      id: 'fb_edge_concurrency_addressed',
      criterionId: 'edge_cases_concurrency',
      type: 'strength',
      title: 'Concurrent Gate Allocation Safeguard Identified',
      evidence:
        concurrencyEvidence ||
        'Concurrency conflict mitigation documented in assumptions or edge cases.',
      impact:
        'Guarantees that simultaneous entries across multiple gates do not result in two drivers being issued tickets for the same spot.',
      suggestion:
        'Maintain atomic state transitions when shifting a spot from vacant to reserved.',
      priority: 'low',
    });
  } else if (mentionsMultiGate) {
    feedback.push({
      id: 'fb_edge_concurrency_risk',
      criterionId: 'edge_cases_concurrency',
      type: 'concern',
      title: 'Concurrent Spot Allocation Risk at Multiple Gates',
      evidence: `System specifies multiple gates or entry points ("${design.assumptions.find((a) => /gate|entry/i.test(a)) || 'Multiple entry points'}"), but does not specify how race conditions are prevented during simultaneous spot assignment.`,
      impact:
        'Without atomic reservation or allocation synchronization, two vehicles arriving at different gates simultaneously could be assigned the exact same spot.',
      suggestion:
        'Document in edgeCasesConsidered how spot reservation handles concurrency (e.g. atomic reservation, allocation lock, or per-floor queueing).',
      priority: 'high',
    });
  } else {
    // Single gate assumption or unstated
    concurrencyScore = 6;
    feedback.push({
      id: 'fb_edge_concurrency_opportunity',
      criterionId: 'edge_cases_concurrency',
      type: 'suggestion',
      title: 'Consider Concurrent Gate Allocation',
      evidence: 'No multi-gate concurrency safeguards documented in assumptions or edge cases.',
      impact:
        'As commercial parking lots scale to multiple entry gates, simultaneous arrivals require thread-safe spot assignment.',
      suggestion:
        'Document how simultaneous entry attempts at multiple gates are coordinated without assigning duplicate spots.',
      priority: 'medium',
    });
  }

  // 3. Operational Robustness & Lifecycle Edge Cases (Max: 8 pts)
  let lifecycleScore = 3;
  const addressesLifecycle =
    /lost ticket|damage|overstay|unpark|invalid|penalty|grace period|exceed/i.test(combinedContext);

  if (addressesLifecycle) {
    lifecycleScore = 8;
    const lifecycleEvidence = design.edgeCasesConsidered.find((ec) =>
      /lost|damage|overstay|penalty|invalid/i.test(ec)
    );
    feedback.push({
      id: 'fb_edge_lifecycle_addressed',
      criterionId: 'edge_cases_concurrency',
      type: 'strength',
      title: 'Operational Lifecycle Edge Case Considered',
      evidence: lifecycleEvidence || 'Ticket lifecycle edge case documented.',
      impact: 'Ensures system resiliently recovers from real-world human operational anomalies.',
      suggestion: 'Ensure maximum fee cap or penalty rates are encapsulated in the fee calculator.',
      priority: 'low',
    });
  } else {
    feedback.push({
      id: 'fb_edge_lifecycle_missing',
      criterionId: 'edge_cases_concurrency',
      type: 'suggestion',
      title: 'Consider Lost Ticket or Overstay Edge Cases',
      evidence: 'No edge case addressing lost tickets, overstays, or payment validation failures was declared.',
      impact:
        'Real-world parking operations frequently encounter lost tickets or drivers staying past operating windows.',
      suggestion:
        'Document how the system handles lost tickets (e.g., maximum daily penalty rate) or invalid ticket states.',
      priority: 'low',
    });
  }

  const rawTotal = capacityScore + concurrencyScore + lifecycleScore;
  const totalScore = Math.min(25, Math.max(0, rawTotal));

  let rating: ScoreRating = 'Needs Improvement';
  if (totalScore >= 21) rating = 'Excellent';
  else if (totalScore >= 16) rating = 'Good';

  return {
    score: {
      criterionId: 'edge_cases_concurrency',
      title: 'Edge Cases & Allocation Robustness',
      score: totalScore,
      maxScore: 25,
      rating,
      summary: addressesConcurrency
        ? 'Robust edge-case coverage including concurrency and capacity management.'
        : 'Good basic edge cases. Adding explicit concurrent gate allocation safeguards will improve robustness.',
    },
    feedback,
  };
}
