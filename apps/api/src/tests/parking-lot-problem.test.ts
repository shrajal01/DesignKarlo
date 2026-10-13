import { describe, it, expect } from 'vitest';
import {
  parkingLotProblem,
  listProblems,
  getProblemBySlug,
  isValidProblemSlug,
} from '../domain';

describe('Parking Lot Problem Definition & Registry', () => {
  it('contains valid core problem metadata', () => {
    expect(parkingLotProblem.id).toBe('prob_parking_lot');
    expect(parkingLotProblem.slug).toBe('parking-lot');
    expect(parkingLotProblem.title).toBe('Parking Lot System');
    expect(parkingLotProblem.difficulty).toBe('Medium');
    expect(parkingLotProblem.functionalRequirements.length).toBeGreaterThanOrEqual(4);
    expect(parkingLotProblem.nonFunctionalConstraints.length).toBeGreaterThanOrEqual(2);
  });

  it('defines a complete 4-criterion rubric totaling exactly 100% weight', () => {
    const rubric = parkingLotProblem.rubric;
    expect(rubric.id).toBe('rubric_parking_lot');
    expect(rubric.criteria).toHaveLength(4);

    const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(100);

    const criterionIds = rubric.criteria.map((c) => c.id);
    expect(criterionIds).toContain('domain_entities');
    expect(criterionIds).toContain('solid_modularity');
    expect(criterionIds).toContain('extensibility_patterns');
    expect(criterionIds).toContain('edge_cases_concurrency');

    for (const criterion of rubric.criteria) {
      expect(criterion.weight).toBe(25);
      expect(criterion.targetConcepts.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('provides starterTemplate and sampleSolution matching the problemSlug', () => {
    expect(parkingLotProblem.starterTemplate.problemSlug).toBe('parking-lot');
    expect(parkingLotProblem.sampleSolution.problemSlug).toBe('parking-lot');
    expect(parkingLotProblem.sampleSolution.entities.length).toBeGreaterThan(
      parkingLotProblem.starterTemplate.entities.length
    );
  });

  it('lists problems via problem registry', () => {
    const problems = listProblems();
    expect(problems.length).toBeGreaterThanOrEqual(1);
    expect(problems.some((p) => p.slug === 'parking-lot')).toBe(true);
  });

  it('retrieves problems by slug correctly', () => {
    const problem = getProblemBySlug('parking-lot');
    expect(problem).toBeDefined();
    expect(problem?.slug).toBe('parking-lot');

    const nonExistent = getProblemBySlug('non-existent-system');
    expect(nonExistent).toBeUndefined();
  });

  it('validates problem slugs', () => {
    expect(isValidProblemSlug('parking-lot')).toBe(true);
    expect(isValidProblemSlug('unknown-slug')).toBe(false);
  });
});
