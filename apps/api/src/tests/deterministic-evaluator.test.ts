import { describe, it, expect } from 'vitest';
import {
  deterministicEvaluator,
  parkingLotProblem,
  StructuredDesign,
} from '../domain';

describe('DeterministicEvaluator', () => {
  it('evaluates a strong design (sampleSolution) with high score and evidence-backed strengths', () => {
    const evaluation = deterministicEvaluator.evaluate(
      parkingLotProblem.sampleSolution,
      parkingLotProblem,
      { submissionId: 'sub_sample' }
    );

    expect(evaluation.overallScore).toBeGreaterThanOrEqual(85);
    expect(evaluation.criterionScores).toHaveLength(4);

    const sumOfCriteria = evaluation.criterionScores.reduce((sum, c) => sum + c.score, 0);
    expect(evaluation.overallScore).toBe(sumOfCriteria);

    for (const c of evaluation.criterionScores) {
      expect(c.maxScore).toBe(25);
      expect(c.score).toBeGreaterThanOrEqual(18);
    }

    // Verify evidence grounding in feedback
    const strengths = evaluation.feedbackItems.filter((f) => f.type === 'strength');
    expect(strengths.length).toBeGreaterThanOrEqual(3);

    for (const item of evaluation.feedbackItems) {
      expect(item.evidence).toBeTruthy();
      expect(item.impact).toBeTruthy();
      expect(item.suggestion).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(item.priority);
    }

    // Verify zero high-priority concerns on the sample solution
    const highConcerns = evaluation.feedbackItems.filter(
      (f) => f.type === 'concern' && f.priority === 'high'
    );
    expect(highConcerns).toHaveLength(0);
  });

  it('evaluates a weak God-Class design with low modularity score and explicit SRP concern', () => {
    const godClassDesign: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['Single parking facility handling vehicles and charging fees.'],
      entities: [
        {
          name: 'MegaParkingLot',
          type: 'class',
          responsibilities: [
            'Directly manages spots and floors',
            'Directly computes parking fee or handles payments',
            'Searches spots and implements allocation algorithm',
            'Issues tickets and maintains ledger',
            'Controls entry barrier gates hardware',
          ],
          attributes: ['spots: string[]', 'feeRate: number', 'tickets: string[]'],
          methods: [
            'parkVehicle(car: Car): string',
            'calculateFeeAndProcessPayment(ticketId: string): number',
            'findSpotForVehicle(): string',
          ],
        },
        {
          name: 'Car',
          type: 'class',
          responsibilities: ['Represents a vehicle'],
          attributes: ['plate: string'],
          methods: [],
        },
      ],
      relationships: [
        {
          source: 'MegaParkingLot',
          target: 'Car',
          type: 'uses',
        },
      ],
      designPatterns: [],
      edgeCasesConsidered: ['Basic overflow handling'],
    };

    const evaluation = deterministicEvaluator.evaluate(godClassDesign, parkingLotProblem, {
      submissionId: 'sub_godclass',
    });

    expect(evaluation.overallScore).toBeLessThanOrEqual(60);

    // Should flag SRP concern in modularity criterion
    const modularityCriterion = evaluation.criterionScores.find(
      (c) => c.criterionId === 'solid_modularity'
    );
    expect(modularityCriterion?.score).toBeLessThanOrEqual(15);

    const srpConcern = evaluation.feedbackItems.find(
      (f) => f.id === 'fb_solid_srp_god_class' && f.priority === 'high'
    );
    expect(srpConcern).toBeDefined();
    expect(srpConcern?.evidence).toContain('MegaParkingLot');
    expect(srpConcern?.impact).toContain('Single Responsibility Principle');
    expect(srpConcern?.suggestion).toContain('Extract fee calculation');
  });

  it('evaluates alternative-but-reasonable designs without requiring exact class names', () => {
    // Design uses SlotManager, ParkingSpace, Automobile, AdmissionPass, TariffPolicy, Level
    const alternativeDesign: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multi-level garage structure with admission gates.',
        'Hourly rates determined by tariff policy.',
      ],
      entities: [
        {
          name: 'SlotManager',
          type: 'class',
          responsibilities: [
            'Coordinates levels and gates',
            'Delegates spot search to AllocationPolicy',
          ],
          attributes: ['levels: Level[]', 'policy: AllocationPolicy'],
          methods: ['admit(auto: Automobile): AdmissionPass', 'release(pass: AdmissionPass): void'],
        },
        {
          name: 'Level',
          type: 'class',
          responsibilities: ['Maintains individual parking spaces on a level'],
          attributes: ['levelId: number', 'spaces: ParkingSpace[]'],
          methods: ['getVacantCount(): number'],
        },
        {
          name: 'ParkingSpace',
          type: 'class',
          responsibilities: ['Encapsulates space vacancy and automobile fit'],
          attributes: ['spaceId: string', 'isVacant: boolean'],
          methods: ['occupy(): void', 'vacate(): void'],
        },
        {
          name: 'Automobile',
          type: 'abstract_class',
          responsibilities: ['Abstract base representing all vehicles'],
          attributes: ['license: string'],
          methods: ['getType(): string'],
        },
        {
          name: 'AdmissionPass',
          type: 'class',
          responsibilities: ['Records entry timestamp and allocated space'],
          attributes: ['passId: string', 'timeIn: Date', 'spaceId: string'],
          methods: ['markSettled(): void'],
        },
        {
          name: 'TariffPolicy',
          type: 'interface',
          responsibilities: ['Defines contract for computing parking charge'],
          attributes: [],
          methods: ['calculateFee(pass: AdmissionPass): number'],
        },
        {
          name: 'AllocationPolicy',
          type: 'interface',
          responsibilities: ['Defines strategy for choosing best vacant space'],
          attributes: [],
          methods: ['findBestSpace(levels: Level[]): ParkingSpace'],
        },
      ],
      relationships: [
        { source: 'SlotManager', target: 'Level', type: 'has_many' },
        { source: 'Level', target: 'ParkingSpace', type: 'has_many' },
        { source: 'SlotManager', target: 'AllocationPolicy', type: 'uses' },
        { source: 'SlotManager', target: 'TariffPolicy', type: 'uses' },
        { source: 'AdmissionPass', target: 'ParkingSpace', type: 'has_a' },
      ],
      designPatterns: [
        {
          patternName: 'Strategy Pattern',
          targetEntity: 'AllocationPolicy',
          justification: 'Allows dynamic swapping of spot search heuristics across levels.',
        },
        {
          patternName: 'Strategy Pattern',
          targetEntity: 'TariffPolicy',
          justification: 'Decouples tariff rates from the facility manager.',
        },
      ],
      edgeCasesConsidered: [
        'Atomic reservation: space is marked occupied immediately upon gate request to prevent concurrent assignment.',
        'Full facility display: admission pass issuance is halted when available count reaches zero.',
      ],
    };

    const evaluation = deterministicEvaluator.evaluate(alternativeDesign, parkingLotProblem, {
      submissionId: 'sub_alternative',
    });

    // Should score high because concepts are well modeled, despite zero exact class name matches
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(80);

    const domainScore = evaluation.criterionScores.find((c) => c.criterionId === 'domain_entities');
    expect(domainScore?.score).toBeGreaterThanOrEqual(20);

    const solidScore = evaluation.criterionScores.find((c) => c.criterionId === 'solid_modularity');
    expect(solidScore?.score).toBeGreaterThanOrEqual(20);
  });

  it('does not label concurrency as defect when allocation behavior and assumptions address it', () => {
    const concurrentDesign: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multiple entrance gates operate simultaneously during morning rush.',
        'Each gate performs atomic reservation against the central spot catalog.',
      ],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: ['Facility coordinator'],
          attributes: [],
          methods: ['park(): void'],
        },
        {
          name: 'ParkingSpot',
          type: 'class',
          responsibilities: ['Encapsulates spot state'],
          attributes: [],
          methods: ['reserveAtomic(): boolean'],
        },
      ],
      relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
      designPatterns: [],
      edgeCasesConsidered: [
        'Concurrent gate collision: Spot allocation applies an atomic check-and-set reservation to guarantee two gates cannot double-book a single spot.',
        'Full lot rejection: Gate terminals show full barrier light when capacity is reached.',
      ],
    };

    const evaluation = deterministicEvaluator.evaluate(concurrentDesign, parkingLotProblem, {
      submissionId: 'sub_concurrent',
    });

    const edgeCriterion = evaluation.criterionScores.find(
      (c) => c.criterionId === 'edge_cases_concurrency'
    );
    expect(edgeCriterion?.score).toBeGreaterThanOrEqual(18);

    const concurrencyRiskConcern = evaluation.feedbackItems.find(
      (f) => f.id === 'fb_edge_concurrency_risk'
    );
    expect(concurrencyRiskConcern).toBeUndefined();

    const concurrencyStrength = evaluation.feedbackItems.find(
      (f) => f.id === 'fb_edge_concurrency_addressed'
    );
    expect(concurrencyStrength).toBeDefined();
  });

  it('flags concurrency risk when multi-gate entry exists without documented safeguards', () => {
    const multiGateWithoutSafeguardDesign: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multiple entry gates and separate exit gates operate across floors.',
      ],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: ['Coordinates multiple gates and spot search'],
          attributes: [],
          methods: ['parkVehicle(): void'],
        },
        {
          name: 'ParkingSpot',
          type: 'class',
          responsibilities: ['Maintains individual spot state'],
          attributes: [],
          methods: [],
        },
      ],
      relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
      designPatterns: [],
      edgeCasesConsidered: ['Basic overflow handling when lot is full'],
    };

    const evaluation = deterministicEvaluator.evaluate(
      multiGateWithoutSafeguardDesign,
      parkingLotProblem,
      { submissionId: 'sub_multi_gate_no_lock' }
    );

    const concurrencyConcern = evaluation.feedbackItems.find(
      (f) => f.id === 'fb_edge_concurrency_risk'
    );
    expect(concurrencyConcern).toBeDefined();
    expect(concurrencyConcern?.priority).toBe('high');
    expect(concurrencyConcern?.impact).toContain('assigned the exact same spot');
  });

  it('does NOT award artificial score bonuses merely for being a later revision', () => {
    const design = parkingLotProblem.starterTemplate;

    const eval1 = deterministicEvaluator.evaluate(design, parkingLotProblem, {
      submissionId: 'sub_rev_1',
    });

    const eval2 = deterministicEvaluator.evaluate(design, parkingLotProblem, {
      submissionId: 'sub_rev_2',
      previousEvaluation: eval1,
      previousRevisionNumber: 1,
    });

    expect(eval2.overallScore).toBe(eval1.overallScore);
    expect(eval2.comparisonWithPrevious?.scoreDelta).toBe(0);
  });

  it('correctly detects resolved, unresolved, and new concerns between revisions', () => {
    // Revision 1: God class with fee calculation inside ParkingLot, no concurrency safeguard
    const rev1Design: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['Multi-gate entry system.'],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: [
            'Directly manages spots and floors',
            'Directly computes parking fee or handles payments',
            'Searches spots and implements allocation algorithm',
          ],
          attributes: [],
          methods: ['calculateFeeAndPay(): number'],
        },
        {
          name: 'ParkingSpot',
          type: 'class',
          responsibilities: ['Spot state'],
          attributes: [],
          methods: [],
        },
      ],
      relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
      designPatterns: [],
      edgeCasesConsidered: ['Full lot rejection'],
    };

    const eval1 = deterministicEvaluator.evaluate(rev1Design, parkingLotProblem, {
      submissionId: 'sub_1',
    });

    // Revision 2: Extracted FeeCalculator into dedicated class, resolving the God class concern!
    const rev2Design: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['Multi-gate entry system.'],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: ['High level coordinator for gates and floors'],
          attributes: [],
          methods: ['admit(): void'],
        },
        {
          name: 'ParkingSpot',
          type: 'class',
          responsibilities: ['Spot state'],
          attributes: [],
          methods: [],
        },
        {
          name: 'FeeCalculator',
          type: 'class',
          responsibilities: ['Dedicated fee calculation based on duration'],
          attributes: [],
          methods: ['computeFee(): number'],
        },
      ],
      relationships: [
        { source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' },
        { source: 'ParkingLot', target: 'FeeCalculator', type: 'uses' },
      ],
      designPatterns: [],
      edgeCasesConsidered: ['Full lot rejection'],
    };

    const eval2 = deterministicEvaluator.evaluate(rev2Design, parkingLotProblem, {
      submissionId: 'sub_2',
      previousEvaluation: eval1,
      previousRevisionNumber: 1,
    });

    expect(eval2.overallScore).toBeGreaterThan(eval1.overallScore);
    expect(eval2.comparisonWithPrevious).toBeDefined();

    const comparison = eval2.comparisonWithPrevious!;
    expect(comparison.scoreDelta).toBeGreaterThan(0);
    expect(comparison.previousRevisionNumber).toBe(1);

    // The God class SRP concern should now be resolved!
    expect(
      comparison.resolvedConcerns.some((c) =>
        c.includes('Single Responsibility Concern: Overburdened Facility Class')
      )
    ).toBe(true);

    // Summary should mention progress
    expect(comparison.summary).toContain('Progress detected');
    expect(comparison.summary).toContain('Resolved');
  });
});
