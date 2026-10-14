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

  it('rejects Revision #4 payload when entity names contain spaces and parentheses', () => {
    const failingRevision4Design = {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multi-floor parking facility with separate entry and exit gates.',
        'Vehicles include Motorcycle, Car, and Truck, with compatibility rules for parking spots.',
      ],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class' as const,
          responsibilities: ['Coordinates parking workflow'],
          attributes: [],
          methods: [],
        },
        {
          name: 'ParkingSpot',
          type: 'class' as const,
          responsibilities: ['Maintains spot state'],
          attributes: [],
          methods: [],
        },
        {
          name: 'SpotAllocationStrategy (INTERFACE)', // Invalid: contains space and parentheses
          type: 'class' as const,
          responsibilities: ['Defines how an appropriate parking spot is selected.'],
          attributes: ['id: string'],
          methods: ['findSpot(vehicle: Vehicle, spots: ParkingSpot[]): ParkingSpot'],
        },
        {
          name: 'PricingStrategy (INTERFACE)', // Invalid: contains space and parentheses
          type: 'class' as const,
          responsibilities: ['Defines the parking fee calculation contract.'],
          attributes: ['id: string'],
          methods: ['calculateFee(ticket: ParkingTicket): number'],
        },
      ],
      relationships: [
        {
          source: 'ParkingLot',
          target: 'SpotAllocationStrategy (INTERFACE)',
          type: 'uses' as const,
        },
      ],
      designPatterns: [],
      edgeCasesConsidered: ['Full lot condition handled gracefully'],
    };

    const result = StructuredDesignSchema.safeParse(failingRevision4Design);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('entities.2.name');
      expect(paths).toContain('entities.3.name');

      const nameError = result.error.errors.find((e) => e.path.join('.') === 'entities.2.name');
      expect(nameError?.message).toContain('Entity name must start with a letter');
      expect(nameError?.message).toContain('no spaces or parentheses');
    }
  });

  it('successfully validates Revision #4 payload once entity names are corrected to valid identifiers', () => {
    const correctedRevision4Design = {
      problemSlug: 'parking-lot',
      assumptions: [
        'Multi-floor parking facility with separate entry and exit gates.',
        'Vehicles include Motorcycle, Car, and Truck, with compatibility rules for parking spots.',
        'Spot allocation and hourly pricing rules may change independently.',
        'Multiple entry gates can process requests concurrently.',
        'A spot must be reserved atomically so that two vehicles cannot occupy the same spot.',
        'If ticket creation fails after reservation, the spot must be released.',
      ],
      entities: [
        {
          name: 'ParkingLot',
          type: 'class' as const,
          responsibilities: [
            'Coordinates the parking workflow and delegates allocation and pricing to dedicated strategies.',
          ],
          attributes: ['spotAllocationStrategy: SpotAllocationStrategy', 'pricingStrategy: PricingStrategy'],
          methods: ['parkVehicle(vehicle: Vehicle): ParkingTicket', 'releaseVehicle(ticketId: string): void'],
        },
        {
          name: 'ParkingFloor',
          type: 'class' as const,
          responsibilities: [
            'Organizes parking spots by floor and provides compatible available spots.',
          ],
          attributes: ['floorNumber: number', 'spots: ParkingSpot[]'],
          methods: ['getAvailableSpot(vehicle: Vehicle): ParkingSpot'],
        },
        {
          name: 'ParkingSpot',
          type: 'class' as const,
          responsibilities: ['Maintains spot compatibility and occupancy status.'],
          attributes: ['spotId: string', 'status: SpotStatus', 'spotType: string'],
          methods: ['isAvailable(): boolean', 'reserve(): boolean', 'release(): void'],
        },
        {
          name: 'Vehicle',
          type: 'class' as const,
          responsibilities: ['Represents a vehicle and its parking requirements.'],
          attributes: ['vehicleNumber: string', 'vehicleType: string'],
          methods: ['getVehicleType(): string'],
        },
        {
          name: 'ParkingTicket',
          type: 'class' as const,
          responsibilities: ['Records parking entry and exit details for a vehicle.'],
          attributes: ['vehicle: Vehicle', 'entryTime: Date', 'exitTime: Date'],
          methods: ['closeTicket(exitTime: Date): void'],
        },
        {
          name: 'SpotAllocationStrategy',
          type: 'interface' as const,
          responsibilities: ['Defines how an appropriate parking spot is selected.'],
          attributes: ['id: string'],
          methods: ['findSpot(vehicle: Vehicle, spots: ParkingSpot[]): ParkingSpot'],
        },
        {
          name: 'NearestSpotStrategy',
          type: 'class' as const,
          responsibilities: ['Selects the nearest compatible available parking spot.'],
          attributes: ['id: string'],
          methods: ['findSpot(vehicle: Vehicle, spots: ParkingSpot[]): ParkingSpot'],
        },
        {
          name: 'PricingStrategy',
          type: 'interface' as const,
          responsibilities: ['Defines the parking fee calculation contract.'],
          attributes: ['id: string'],
          methods: ['calculateFee(ticket: ParkingTicket): number'],
        },
        {
          name: 'HourlyPricingStrategy',
          type: 'class' as const,
          responsibilities: ['Calculates parking fees based on duration and vehicle type.'],
          attributes: ['hourlyRates: Map<VehicleType, number>'],
          methods: ['calculateFee(ticket: ParkingTicket): number'],
        },
        {
          name: 'SpotReservationService',
          type: 'class' as const,
          responsibilities: [
            'Atomically reserves a spot and prevents concurrent requests from claiming the same spot.',
          ],
          attributes: ['reservationStore: ReservationStore'],
          methods: ['reserveSpot(vehicle: Vehicle): boolean', 'releaseReservation(spot: ParkingSpot): void'],
        },
        {
          name: 'TicketService',
          type: 'class' as const,
          responsibilities: ['Creates, validates, and closes parking tickets.'],
          attributes: ['tickets: Map<string, ParkingTicket>'],
          methods: ['issueTicket(vehicle: Vehicle): ParkingTicket', 'closeTicket(ticketId: string): void'],
        },
        {
          name: 'ParkingGate',
          type: 'class' as const,
          responsibilities: [
            'Handles vehicle entry and exit requests and delegates them to the parking workflow.',
          ],
          attributes: ['gateId: string', 'gateType: string'],
          methods: ['processEntry(vehicle: Vehicle): ParkingTicket', 'processExit(ticketId: string): void'],
        },
      ],
      relationships: [
        {
          source: 'ParkingLot',
          target: 'ParkingFloor',
          type: 'has_many' as const,
          description: 'ParkingLot contains multiple floors.',
        },
        {
          source: 'ParkingFloor',
          target: 'ParkingSpot',
          type: 'has_many' as const,
          description: 'Each floor manages its parking spots.',
        },
        {
          source: 'ParkingLot',
          target: 'SpotAllocationStrategy',
          type: 'uses' as const,
          description: 'Allocation rules are replaceable without changing',
        },
        {
          source: 'NearestSpotStrategy',
          target: 'SpotAllocationStrategy',
          type: 'implements' as const,
          description: 'Selects the nearest compatible available spot.',
        },
        {
          source: 'ParkingLot',
          target: 'PricingStrategy',
          type: 'uses' as const,
          description: 'Pricing calculation is independent of parking arch',
        },
        {
          source: 'HourlyPricingStrategy',
          target: 'PricingStrategy',
          type: 'implements' as const,
          description: 'Implements hourly pricing rules.',
        },
        {
          source: 'ParkingGate',
          target: 'TicketService',
          type: 'uses' as const,
          description: 'Gates delegate ticket creation, validation, and clo',
        },
        {
          source: 'ParkingGate',
          target: 'SpotReservationService',
          type: 'uses' as const,
          description: 'Entry requests use the reservation service to avoid',
        },
      ],
      designPatterns: [
        {
          patternName: 'Strategy',
          targetEntity: 'SpotAllocationStrategy',
          justification: 'Supports different allocation policies without modifying ParkingLot.',
        },
        {
          patternName: 'Strategy',
          targetEntity: 'PricingStrategy',
          justification: 'Allows pricing rules to change independently.',
        },
        {
          patternName: 'Interface-based service abstraction',
          targetEntity: 'SpotReservationService',
          justification:
            'Separates reservation and ticket lifecycle responsibilities from workflow coordin',
        },
      ],
      edgeCasesConsidered: [
        'Lot full: reject the request when no compatible spot exists.',
        'Concurrent allocation: SpotReservationService must atomically verify availability and reserve the spot so that two gates cannot allocate it to different vehicles.',
        'Reservation conflict: if another request reserves the spot first, select another compatible spot.',
        'Ticket creation failure: release the reservation to avoid leaving a spot incorrectly occupied.',
        'Pricing changes: introduce another PricingStrategy implementation without changing ParkingLot.',
      ],
    };

    const result = StructuredDesignSchema.safeParse(correctedRevision4Design);
    expect(result.success).toBe(true);
  });

  it('captures multiple simultaneous validation errors across all sections', () => {
    const multiErrorDesign = {
      problemSlug: 'parking-lot',
      assumptions: ['OK'], // < 3 chars
      entities: [
        {
          name: 'ValidEntity',
          type: 'class' as const,
          responsibilities: ['Valid responsibility'],
          attributes: [],
          methods: [],
        },
        {
          name: '123InvalidStart', // starts with digit
          type: 'class' as const,
          responsibilities: [], // empty responsibilities
          attributes: [],
          methods: [],
        },
      ],
      relationships: [
        {
          source: 'ValidEntity',
          target: 'NonExistentEntity', // undeclared target
          type: 'uses' as const,
        },
      ],
      designPatterns: [
        {
          patternName: 'S', // < 2 chars
          targetEntity: 'ValidEntity',
          justification: 'Tiny', // < 5 chars
        },
      ],
      edgeCasesConsidered: ['No'], // < 3 chars
    };

    const result = StructuredDesignSchema.safeParse(multiErrorDesign);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('assumptions.0');
      expect(paths).toContain('entities.1.name');
      expect(paths).toContain('entities.1.responsibilities');
      expect(paths).toContain('relationships.0.target');
      expect(paths).toContain('designPatterns.0.patternName');
      expect(paths).toContain('designPatterns.0.justification');
      expect(paths).toContain('edgeCasesConsidered.0');
    }
  });
});

