import { describe, it, expect } from 'vitest';
import {
  StructuredDesignSchema,
  parkingLotProblem,
} from '../domain';

describe('StructuredDesignSchema', () => {
  it('successfully validates the Parking Lot starterTemplate', () => {
    const result = StructuredDesignSchema.safeParse(parkingLotProblem.starterTemplate);
    expect(result.success).toBe(true);
  });

  it('successfully validates the Parking Lot sampleSolution', () => {
    const result = StructuredDesignSchema.safeParse(parkingLotProblem.sampleSolution);
    expect(result.success).toBe(true);
  });

  it('rejects submissions with fewer than 2 entities', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      entities: [parkingLotProblem.starterTemplate.entities[0]],
      relationships: [],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('entities'))).toBe(true);
    }
  });

  it('rejects submissions with empty assumptions', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      assumptions: [],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('assumptions'))).toBe(true);
    }
  });

  it('rejects submissions with empty edge cases', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      edgeCasesConsidered: [],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('edgeCasesConsidered'))).toBe(true);
    }
  });

  it('rejects entities lacking defined responsibilities', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      entities: [
        {
          name: 'EmptyEntity',
          type: 'class' as const,
          responsibilities: [],
          attributes: [],
          methods: [],
        },
        parkingLotProblem.starterTemplate.entities[1],
      ],
      relationships: [],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.path.includes('responsibilities'))).toBe(true);
    }
  });

  it('rejects duplicate entity names', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      entities: [
        {
          name: 'Car',
          type: 'class' as const,
          responsibilities: ['Represents a compact automobile'],
          attributes: [],
          methods: [],
        },
        {
          name: 'car', // duplicate name with different casing
          type: 'class' as const,
          responsibilities: ['Represents another car'],
          attributes: [],
          methods: [],
        },
      ],
      relationships: [],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes('Duplicate entity name'))).toBe(true);
    }
  });

  it('rejects relationships referencing undeclared source entities', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      relationships: [
        {
          source: 'NonExistentEntity',
          target: parkingLotProblem.starterTemplate.entities[0].name,
          type: 'has_a' as const,
        },
      ],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes('not declared in the entities list'))).toBe(true);
    }
  });

  it('rejects relationships referencing undeclared target entities', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      relationships: [
        {
          source: parkingLotProblem.starterTemplate.entities[0].name,
          target: 'NonExistentTarget',
          type: 'uses' as const,
        },
      ],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((e) => e.message.includes('not declared in the entities list'))).toBe(true);
    }
  });

  it('rejects entity names beginning with a number', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      entities: [
        {
          name: '1InvalidEntity',
          type: 'class' as const,
          responsibilities: ['Represents an invalid entity'],
          attributes: [],
          methods: [],
        },
        parkingLotProblem.starterTemplate.entities[1],
      ],
      relationships: [],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.errors.some(
          (e) => e.path.includes('name') && e.message.includes('must start with a letter')
        )
      ).toBe(true);
    }
  });

  it('rejects design pattern justifications shorter than 5 characters', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      designPatterns: [
        {
          patternName: 'Strategy',
          targetEntity: parkingLotProblem.starterTemplate.entities[0].name,
          justification: 'Tiny', // < 5 chars
        },
      ],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.errors.some(
          (e) => e.path.includes('justification') && e.message.includes('min 5 characters')
        )
      ).toBe(true);
    }
  });

  it('rejects design patterns targeting undeclared entities', () => {
    const invalidDesign = {
      ...parkingLotProblem.starterTemplate,
      designPatterns: [
        {
          patternName: 'Factory',
          targetEntity: 'NonExistentTargetEntity',
          justification: 'Creates specialized vehicles dynamically',
        },
      ],
    };

    const result = StructuredDesignSchema.safeParse(invalidDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.errors.some(
          (e) =>
            e.path.includes('targetEntity') &&
            e.message.includes('is not declared in the entities list')
        )
      ).toBe(true);
    }
  });
});

