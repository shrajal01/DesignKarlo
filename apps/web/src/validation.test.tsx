import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { validateStructuredDesign, formatErrorLocation } from './utils/validation';
import { normalizeAndValidateImportJson } from './utils/importer';
import { StructuredEditor } from './components/StructuredEditor';
import type { StructuredDesign, Problem } from './types';

const sampleProblem: Problem = {
  id: 'prob_parking_lot',
  slug: 'parking-lot',
  title: 'Parking Lot System',
  difficulty: 'Medium',
  summary: 'Design parking lot',
  description: 'Detailed description',
  functionalRequirements: ['Req 1'],
  nonFunctionalConstraints: ['Constraint 1'],
  rubric: {
    id: 'rubric_1',
    totalWeight: 100,
    criteria: [],
  },
  starterTemplate: {
    problemSlug: 'parking-lot',
    assumptions: ['Assumption 1'],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: ['Coordinates workflow'],
        attributes: [],
        methods: [],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: ['Manages spot'],
        attributes: [],
        methods: [],
      },
    ],
    relationships: [{ source: 'ParkingLot', target: 'ParkingSpot', type: 'has_many' }],
    designPatterns: [],
    edgeCasesConsidered: ['Full lot'],
  },
  sampleSolution: {
    problemSlug: 'parking-lot',
    assumptions: ['Assumption 1'],
    entities: [],
    relationships: [],
    designPatterns: [],
    edgeCasesConsidered: [],
  },
};

describe('Frontend Validation Engine (validateStructuredDesign)', () => {
  it('correctly identifies the exact validation errors in the Revision #4 failing payload', () => {
    const failingRevision4: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multi-floor parking facility with separate entry and exit gates.',
        'Vehicles include Motorcycle, Car, and Truck, with compatibility rules for parking spots.',
      ],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: ['Coordinates parking workflow'],
          attributes: [],
          methods: [],
        },
        {
          name: 'ParkingFloor',
          type: 'class',
          responsibilities: ['Organizes parking spots'],
          attributes: [],
          methods: [],
        },
        {
          name: 'ParkingSpot',
          type: 'class',
          responsibilities: ['Maintains occupancy status'],
          attributes: [],
          methods: [],
        },
        {
          name: 'Vehicle',
          type: 'class',
          responsibilities: ['Represents a vehicle'],
          attributes: [],
          methods: [],
        },
        {
          name: 'ParkingTicket',
          type: 'class',
          responsibilities: ['Records entry details'],
          attributes: [],
          methods: [],
        },
        {
          name: 'SpotAllocationStrategy (INTERFACE)', // Invalid: index 5
          type: 'class',
          responsibilities: ['Defines how an appropriate parking spot is selected.'],
          attributes: ['id: string'],
          methods: ['findSpot(): ParkingSpot'],
        },
        {
          name: 'NearestSpotStrategy',
          type: 'class',
          responsibilities: ['Selects the nearest spot.'],
          attributes: [],
          methods: [],
        },
        {
          name: 'PricingStrategy (INTERFACE)', // Invalid: index 7
          type: 'class',
          responsibilities: ['Defines the fee calculation contract.'],
          attributes: ['id: string'],
          methods: ['calculateFee(): number'],
        },
      ],
      relationships: [
        {
          source: 'ParkingLot',
          target: 'SpotAllocationStrategy (INTERFACE)',
          type: 'uses',
        },
      ],
      designPatterns: [],
      edgeCasesConsidered: ['Lot full handled gracefully.'],
    };

    const errors = validateStructuredDesign(failingRevision4);
    expect(errors).toHaveLength(2);

    const paths = errors.map((e) => e.path);
    expect(paths).toContain('entities.5.name');
    expect(paths).toContain('entities.7.name');

    const err5 = errors.find((e) => e.path === 'entities.5.name');
    expect(err5?.message).toContain('no spaces or parentheses like "(INTERFACE)"');
    expect(err5?.message).toContain('select the interface type from the dropdown instead');

    const err7 = errors.find((e) => e.path === 'entities.7.name');
    expect(err7?.message).toContain('no spaces or parentheses like "(INTERFACE)"');
  });

  it('validates without errors when entity names are corrected to valid identifiers', () => {
    const validRevision4: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['Multi-floor parking facility with separate gates.'],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: ['Coordinates parking workflow'],
          attributes: [],
          methods: [],
        },
        {
          name: 'SpotAllocationStrategy',
          type: 'interface',
          responsibilities: ['Defines spot selection'],
          attributes: [],
          methods: [],
        },
        {
          name: 'PricingStrategy',
          type: 'interface',
          responsibilities: ['Defines fee calculation'],
          attributes: [],
          methods: [],
        },
      ],
      relationships: [
        {
          source: 'ParkingLot',
          target: 'SpotAllocationStrategy',
          type: 'uses',
        },
      ],
      designPatterns: [
        {
          patternName: 'Strategy',
          targetEntity: 'SpotAllocationStrategy',
          justification: 'Enables dynamic swapping of allocation algorithms',
        },
      ],
      edgeCasesConsidered: ['Full lot condition handled cleanly'],
    };

    const errors = validateStructuredDesign(validRevision4);
    expect(errors).toHaveLength(0);
  });

  it('flags multiple simultaneous errors across different sections', () => {
    const invalidDraft: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['No'], // < 3 chars
      entities: [
        {
          name: 'A', // < 2 chars
          type: 'class',
          responsibilities: [], // empty responsibilities
          attributes: [],
          methods: [],
        },
        {
          name: 'B',
          type: 'class',
          responsibilities: ['Valid responsibility'],
          attributes: [],
          methods: [],
        },
      ],
      relationships: [
        {
          source: 'A',
          target: 'NonExistentTarget', // undeclared entity
          type: 'uses',
        },
      ],
      designPatterns: [
        {
          patternName: 'X', // < 2 chars
          targetEntity: 'GhostEntity', // undeclared entity
          justification: 'Sh', // < 5 chars
        },
      ],
      edgeCasesConsidered: [''], // < 3 chars
    };

    const errors = validateStructuredDesign(invalidDraft);
    const errorPaths = errors.map((e) => e.path);

    expect(errorPaths).toContain('assumptions.0');
    expect(errorPaths).toContain('entities.0.name');
    expect(errorPaths).toContain('entities.0.responsibilities');
    expect(errorPaths).toContain('relationships.0.target');
    expect(errorPaths).toContain('designPatterns.0.patternName');
    expect(errorPaths).toContain('designPatterns.0.targetEntity');
    expect(errorPaths).toContain('designPatterns.0.justification');
    expect(errorPaths).toContain('edgeCasesConsidered.0');
  });
});

describe('formatErrorLocation', () => {
  const mockDraft: StructuredDesign = {
    problemSlug: 'parking-lot',
    assumptions: ['Assumption 1'],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: ['Coordinates workflow'],
        attributes: [],
        methods: [],
      },
    ],
    relationships: [{ source: 'ParkingLot', target: 'Spot', type: 'has_a' }],
    designPatterns: [{ patternName: 'Strategy', targetEntity: 'ParkingLot', justification: 'Decouples logic' }],
    edgeCasesConsidered: ['Lot full'],
  };

  it('formats entity name error location with class name and element ID', () => {
    const loc = formatErrorLocation('entities.0.name', mockDraft);
    expect(loc.section).toBe('Classes & Responsibilities');
    expect(loc.label).toBe('Class "ParkingLot" • Name');
    expect(loc.elementId).toBe('field-entities-0-name');
  });

  it('formats relationship error location with source and target', () => {
    const loc = formatErrorLocation('relationships.0.target', mockDraft);
    expect(loc.section).toBe('Relationships');
    expect(loc.label).toContain('Relationship #1');
    expect(loc.label).toContain('Target Entity');
    expect(loc.elementId).toBe('field-relationships-0');
  });

  it('formats design pattern error location', () => {
    const loc = formatErrorLocation('designPatterns.0.justification', mockDraft);
    expect(loc.section).toBe('Design Patterns');
    expect(loc.label).toContain('Pattern: "Strategy"');
    expect(loc.elementId).toBe('field-designPatterns-0');
  });
});

describe('StructuredEditor Validation UI', () => {
  it('renders the validation summary box with exact error count and messages', () => {
    const mockErrors = [
      {
        path: 'entities.0.name',
        message: 'Entity name must start with a letter and contain only alphanumeric characters.',
      },
      {
        path: 'relationships.0.target',
        message: 'Relationship target entity "Spot" is not declared in the entities list.',
      },
    ];

    render(
      <StructuredEditor
        problem={sampleProblem}
        draft={sampleProblem.starterTemplate}
        onChangeDraft={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        revisionNumber={4}
        validationErrors={mockErrors}
      />
    );

    // Summary box header
    expect(screen.getByText(/Submission has 2 validation errors/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix the highlighted fields below/i)).toBeInTheDocument();

    // Specific messages displayed in summary and beneath field
    const entityNameErrors = screen.getAllByText(
      'Entity name must start with a letter and contain only alphanumeric characters.'
    );
    expect(entityNameErrors.length).toBeGreaterThanOrEqual(1);

    const relErrors = screen.getAllByText(
      'Relationship target entity "Spot" is not declared in the entities list.'
    );
    expect(relErrors.length).toBeGreaterThanOrEqual(1);

    // Footer indicator shows 2 errors to fix
    expect(screen.getByText(/2 errors to fix/i)).toBeInTheDocument();
  });

  it('renders field-level error messages next to the erroneous fields', () => {
    const mockErrors = [
      {
        path: 'entities.0.name',
        message: 'Entity name cannot contain parentheses or spaces.',
      },
      {
        path: 'relationships.0.target',
        message: 'Target entity is not declared.',
      },
    ];

    render(
      <StructuredEditor
        problem={sampleProblem}
        draft={sampleProblem.starterTemplate}
        onChangeDraft={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        revisionNumber={4}
        validationErrors={mockErrors}
      />
    );

    // Error message appears in field location
    const fieldErrors = screen.getAllByText('Entity name cannot contain parentheses or spaces.');
    expect(fieldErrors.length).toBeGreaterThanOrEqual(2); // In summary and beneath field

    const targetErrors = screen.getAllByText(/Target entity is not declared/);
    expect(targetErrors.length).toBeGreaterThanOrEqual(2);
  });

  it('cascades entity rename to relationships and design patterns so references do not break', () => {
    const draftWithRelations: StructuredDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['Assumption 1'],
      entities: [
        {
          name: 'OldEntityName',
          type: 'class',
          responsibilities: ['Coordinates workflow'],
          attributes: [],
          methods: [],
        },
        {
          name: 'OtherEntity',
          type: 'class',
          responsibilities: ['Handles secondary work'],
          attributes: [],
          methods: [],
        },
      ],
      relationships: [
        { source: 'OtherEntity', target: 'OldEntityName', type: 'uses' },
      ],
      designPatterns: [
        { patternName: 'Strategy', targetEntity: 'OldEntityName', justification: 'Pluggable strategy' },
      ],
      edgeCasesConsidered: ['Full lot'],
    };

    const handleChangeDraft = vi.fn();

    const { container } = render(
      <StructuredEditor
        problem={sampleProblem}
        draft={draftWithRelations}
        onChangeDraft={handleChangeDraft}
        onSubmit={vi.fn()}
        isSubmitting={false}
        revisionNumber={4}
        validationErrors={[]}
      />
    );

    const nameInput = container.querySelector('#field-entities-0-name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'NewEntityName' } });

    expect(handleChangeDraft).toHaveBeenCalled();
    const updatedDraft = handleChangeDraft.mock.calls[0][0];

    // Entity renamed
    expect(updatedDraft.entities[0].name).toBe('NewEntityName');
    // Relationship target automatically updated
    expect(updatedDraft.relationships[0].target).toBe('NewEntityName');
    // Design pattern target automatically updated
    expect(updatedDraft.designPatterns[0].targetEntity).toBe('NewEntityName');
  });
});

describe('JSON-to-Form Importer & Crash Prevention Regression Tests', () => {
  // Failing custom Parking Lot JSON from testing that triggered blank-screen crashes
  const customFailingParkingLotJson = JSON.stringify(
    {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multi-floor parking lot with gates.',
        'Supports Motorcycle, Car, and Truck.',
      ],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class',
          responsibilities: ['Coordinates parking workflows'],
          // attributes omitted!
          // methods omitted!
        },
        {
          name: 'ParkingFloor',
          type: 'class',
          responsibilities: ['Manages level spots'],
          // attributes omitted!
          // methods omitted!
        },
        {
          name: 'Vehicle',
          type: 'abstract_class',
          responsibilities: ['Base vehicle entity'],
          attributes: [{ name: 'licensePlate', type: 'string' }], // Object format
          methods: [{ name: 'getType', returnType: 'string', params: '' }], // Object format
        },
      ],
      // relationships omitted!
      // designPatterns omitted!
      edgeCases: ['Lot full handled with rejection.'], // Alias "edgeCases" instead of "edgeCasesConsidered"!
    },
    null,
    2
  );

  it('safely normalizes custom Parking Lot JSON with omitted attributes, methods, relationships, and alias edgeCases', () => {
    const result = normalizeAndValidateImportJson(customFailingParkingLotJson, 'parking-lot');
    expect(result.success).toBe(true);
    expect(result.design).toBeDefined();

    const design = result.design!;
    // Missing attributes and methods default safely to arrays
    expect(Array.isArray(design.entities[0].attributes)).toBe(true);
    expect(design.entities[0].attributes).toEqual([]);
    expect(Array.isArray(design.entities[0].methods)).toBe(true);
    expect(design.entities[0].methods).toEqual([]);

    // Object attributes and methods normalized to string declarations
    expect(design.entities[2].attributes).toEqual(['licensePlate: string']);
    expect(design.entities[2].methods).toEqual(['getType(): string']);

    // Missing relationships and designPatterns default to empty arrays
    expect(Array.isArray(design.relationships)).toBe(true);
    expect(design.relationships).toEqual([]);
    expect(Array.isArray(design.designPatterns)).toBe(true);
    expect(design.designPatterns).toEqual([]);

    // Alias edgeCases normalized to edgeCasesConsidered
    expect(design.edgeCasesConsidered).toEqual(['Lot full handled with rejection.']);
  });

  it('rejects malformed syntax JSON and returns readable error message', () => {
    const malformed = '{"problemSlug": "parking-lot", entities: [';
    const result = normalizeAndValidateImportJson(malformed, 'parking-lot');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid JSON syntax/i);
    expect(result.design).toBeUndefined();
  });

  it('rejects non-object JSON values like primitives or arrays', () => {
    const arrayJson = JSON.stringify(['ParkingLot', 'ParkingSpot']);
    const result = normalizeAndValidateImportJson(arrayJson, 'parking-lot');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Imported JSON must be an object');

    const numberJson = '42';
    const numResult = normalizeAndValidateImportJson(numberJson, 'parking-lot');
    expect(numResult.success).toBe(false);
    expect(numResult.error).toContain('Imported JSON must be an object');
  });

  it('rejects JSON missing entities or with fewer than 2 entities with readable error', () => {
    const missingEntities = JSON.stringify({
      assumptions: ['Valid assumption'],
      edgeCasesConsidered: ['Full lot'],
    });
    const res1 = normalizeAndValidateImportJson(missingEntities, 'parking-lot');
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('must contain an "entities" array with at least 2 entities');

    const singleEntity = JSON.stringify({
      assumptions: ['Valid assumption'],
      entities: [{ name: 'SoloEntity', responsibilities: ['Only one'] }],
      edgeCasesConsidered: ['Full lot'],
    });
    const res2 = normalizeAndValidateImportJson(singleEntity, 'parking-lot');
    expect(res2.success).toBe(false);
    expect(res2.error).toContain('must declare at least 2 entities');
  });

  it('StructuredEditor successfully applies custom Parking Lot JSON without blank-screen crash', () => {
    const handleChangeDraft = vi.fn();

    render(
      <StructuredEditor
        problem={sampleProblem}
        draft={sampleProblem.starterTemplate}
        onChangeDraft={handleChangeDraft}
        onSubmit={vi.fn()}
        isSubmitting={false}
        revisionNumber={1}
        validationErrors={[]}
      />
    );

    // Switch to JSON tab
    const jsonTabButton = screen.getByRole('button', { name: /json/i });
    fireEvent.click(jsonTabButton);

    // Find textarea and paste custom failing JSON
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: customFailingParkingLotJson } });

    // Click Apply JSON to Form
    const applyButton = screen.getByRole('button', { name: /apply json to form/i });
    fireEvent.click(applyButton);

    // Draft updated with normalized fields
    expect(handleChangeDraft).toHaveBeenCalled();
    const appliedDraft: StructuredDesign = handleChangeDraft.mock.calls[0][0];

    expect(appliedDraft.entities).toHaveLength(3);
    expect(appliedDraft.entities[0].name).toBe('ParkingLot');
    expect(appliedDraft.entities[0].attributes).toEqual([]);
    expect(appliedDraft.entities[0].methods).toEqual([]);
    expect(appliedDraft.relationships).toEqual([]);
    expect(appliedDraft.edgeCasesConsidered).toEqual(['Lot full handled with rejection.']);

    // Now re-render with the applied draft to prove the form renders without crashing
    const { container } = render(
      <StructuredEditor
        problem={sampleProblem}
        draft={appliedDraft}
        onChangeDraft={vi.fn()}
        onSubmit={vi.fn()}
        isSubmitting={false}
        revisionNumber={1}
        validationErrors={[]}
      />
    );

    // Section headers and inputs render without throwing TypeErrors
    expect(screen.getByText(/2\. Classes & Responsibilities \(3\)/i)).toBeInTheDocument();
    expect(container.querySelector('#field-entities-0-name')).toHaveValue('ParkingLot');
    expect(container.querySelector('#field-entities-0-attributes')).toHaveValue('');
    expect(container.querySelector('#field-entities-0-methods')).toHaveValue('');
    expect(screen.getByText(/3 classes declared/i)).toBeInTheDocument();
  });

  it('StructuredEditor preserves existing form data when invalid JSON is applied and shows readable error', () => {
    const handleChangeDraft = vi.fn();

    render(
      <StructuredEditor
        problem={sampleProblem}
        draft={sampleProblem.starterTemplate}
        onChangeDraft={handleChangeDraft}
        onSubmit={vi.fn()}
        isSubmitting={false}
        revisionNumber={1}
        validationErrors={[]}
      />
    );

    // Switch to JSON tab
    fireEvent.click(screen.getByRole('button', { name: /json/i }));

    // Input completely invalid JSON
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{ invalid: broken json' } });

    // Apply JSON
    fireEvent.click(screen.getByRole('button', { name: /apply json to form/i }));

    // Must show readable error in JSON tab
    expect(screen.getByText(/Invalid JSON syntax/i)).toBeInTheDocument();

    // Draft was NOT updated (existing form data preserved)
    expect(handleChangeDraft).not.toHaveBeenCalled();
  });
});

