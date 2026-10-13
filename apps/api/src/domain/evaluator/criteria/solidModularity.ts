import type { StructuredDesign } from '../../schemas/submission';
import type { CriterionScore, FeedbackItem, ScoreRating } from '../../types/evaluation';

export function evaluateSolidModularity(design: StructuredDesign): {
  score: CriterionScore;
  feedback: FeedbackItem[];
} {
  const feedback: FeedbackItem[] = [];
  const entities = design.entities;

  let modularityScore = 18; // baseline for valid structure

  // 1. Check for dedicated Pricing / Fee calculation separation
  const feeEntities = entities.filter(
    (e) =>
      /fee|price|pricing|rate|tariff|calculator/i.test(e.name) ||
      e.responsibilities.some((r) => /calculate fee|pricing rule|hourly rate|compute fare/i.test(r))
  );

  const lotEntities = entities.filter((e) => /parkinglot|garage|facility/i.test(e.name));

  let lotHasFeeCalculation = false;
  let lotGodClassCandidate: { name: string; reasons: string[] } | null = null;

  for (const lot of lotEntities) {
    const reasons: string[] = [];
    const feeInLot =
      lot.methods.some((m) => /fee|calc|price|fare|pay/i.test(m)) ||
      lot.responsibilities.some((r) => /fee|fare|pricing|payment/i.test(r));

    if (feeInLot) {
      lotHasFeeCalculation = true;
      reasons.push('Directly computes parking fee or handles payments');
    }

    const allocationInLot =
      lot.methods.some((m) => /findspot|allocatespot|assignspot|search/i.test(m)) ||
      lot.responsibilities.some((r) => /assign spot|find spot|allocation algorithm/i.test(r));

    if (allocationInLot) {
      reasons.push('Directly implements spot allocation search algorithm');
    }

    if (lot.responsibilities.length > 3 || reasons.length >= 2) {
      lotGodClassCandidate = { name: lot.name, reasons };
    }
  }

  if (feeEntities.length > 0 && !lotHasFeeCalculation) {
    modularityScore += 5;
    feedback.push({
      id: 'fb_solid_pricing_separated',
      criterionId: 'solid_modularity',
      type: 'strength',
      title: 'Decoupled Fee Calculation (SRP Compliant)',
      evidence: `Pricing logic is isolated in "${feeEntities.map((e) => e.name).join(', ')}" rather than accumulated in the facility coordinator.`,
      impact:
        'Pricing rules (peak hours, weekend surge, vehicle tier tariffs) can evolve independently without risking regression in gate or floor management.',
      suggestion: 'Maintain this separation by defining pricing strategies through clean interfaces.',
      priority: 'low',
    });
  } else if (lotGodClassCandidate && lotGodClassCandidate.reasons.length > 0) {
    modularityScore -= 7;
    feedback.push({
      id: 'fb_solid_srp_god_class',
      criterionId: 'solid_modularity',
      type: 'concern',
      title: 'Single Responsibility Concern: Overburdened Facility Class',
      evidence: `Class "${lotGodClassCandidate.name}" performs multiple divergent duties: ${lotGodClassCandidate.reasons.join('; ')}.`,
      impact:
        'Violates the Single Responsibility Principle (SRP). Combining tariff calculation and spot searching inside the coordinator creates tight coupling and makes the class fragile to future requirement changes.',
      suggestion:
        'Extract fee calculation into a dedicated PricingStrategy or FeeCalculator, and spot search into a SpotAssignmentStrategy.',
      priority: 'high',
    });
  }

  // 2. Evaluate relationship coupling
  const relationships = design.relationships;
  const hasCompositionOrAggregation = relationships.some(
    (r) => r.type === 'has_many' || r.type === 'has_a' || r.type === 'aggregates' || r.type === 'composes'
  );

  if (hasCompositionOrAggregation) {
    modularityScore += 2;
  } else if (relationships.length > 0) {
    feedback.push({
      id: 'fb_solid_aggregation_sparse',
      criterionId: 'solid_modularity',
      type: 'concern',
      title: 'Loose Containment Modeling',
      evidence: `Relationships declared (${relationships.map((r) => `${r.source} -> ${r.target}`).join(', ')}) lack explicit has_a or has_many structural containment.`,
      impact:
        'Makes it ambiguous whether subcomponents (like spots on floors) are owned or loosely referenced.',
      suggestion:
        'Model clear containment relationships (e.g., ParkingLot has_many ParkingFloor; ParkingFloor has_many ParkingSpot).',
      priority: 'medium',
    });
  }

  const finalScore = Math.min(25, Math.max(0, modularityScore));

  let rating: ScoreRating = 'Needs Improvement';
  if (finalScore >= 21) rating = 'Excellent';
  else if (finalScore >= 16) rating = 'Good';

  return {
    score: {
      criterionId: 'solid_modularity',
      title: 'Cohesion & SOLID Modularity',
      score: finalScore,
      maxScore: 25,
      rating,
      summary:
        lotGodClassCandidate && lotGodClassCandidate.reasons.length > 0
          ? `Cohesion concern flagged in ${lotGodClassCandidate.name}. Separation of concerns needs refinement.`
          : 'Clean separation of concerns with appropriate interface boundaries.',
    },
    feedback,
  };
}
