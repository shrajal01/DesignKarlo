import { Problem } from '../types/problem';

export const parkingLotProblem: Problem = {
  id: 'prob_parking_lot',
  slug: 'parking-lot',
  title: 'Parking Lot System',
  difficulty: 'Medium',
  summary:
    'Design an object-oriented multi-floor parking lot management system supporting diverse vehicle types, dynamic spot allocation, and duration-based pricing.',
  description: `A commercial parking facility has multiple floors with varying spot sizes (compact, regular, large, and electric). 
The system must manage vehicle entry and exit across multiple entry/exit gates, issue and track parking tickets, allocate optimal spots, 
and compute parking fees based on vehicle type and duration parked.

The design should prioritize high cohesion, clear interface boundaries, and extensibility for new vehicle classifications or pricing models.`,
  functionalRequirements: [
    'Support multiple vehicle types (e.g. Motorcycle, Car, Van, Truck) with corresponding spot compatibility.',
    'Support multi-floor architecture where each floor tracks available spots by size.',
    'Issue a parking ticket at entry with a unique ID, entry timestamp, assigned spot, and vehicle details.',
    'Calculate and process parking fee on exit based on parking duration and vehicle pricing rules.',
    'Support configurable spot assignment strategies (e.g. nearest-to-entrance, best-fit, or random).',
    'Display available spot counts per floor and reject vehicles when the lot or compatible spots are full.',
  ],
  nonFunctionalConstraints: [
    'Adhere to SOLID design principles: avoid God Classes combining spot search, hardware control, and fee calculation.',
    'Open/Closed Principle: adding new vehicle types or pricing structures should not require altering existing allocation algorithms.',
    'Modularity: decoupling between spot assignment strategy, fee calculation, and core lot administration.',
    'Robustness: state transitions (e.g. spot occupancy, ticket status) must be clearly encapsulated.',
  ],
  rubric: {
    id: 'rubric_parking_lot',
    totalWeight: 100,
    criteria: [
      {
        id: 'domain_entities',
        title: 'Core Entity Decomposition',
        weight: 25,
        description:
          'Evaluates whether essential domain concepts (vehicles, parking spots, floors/lots, and ticketing/receipts) are modeled with appropriate abstractions and responsibilities.',
        targetConcepts: [
          'Vehicle representation (base class, interface, or hierarchy)',
          'ParkingSpot representation with state/type mapping',
          'Ticket / Transaction representation capturing duration and spot assignment',
          'ParkingLot or Floor coordinator aggregating components',
        ],
      },
      {
        id: 'solid_modularity',
        title: 'Cohesion & SOLID Modularity',
        weight: 25,
        description:
          'Evaluates separation of concerns. Discourages God Classes and verifies that core lot orchestration does not directly handle complex calculation or payment logic.',
        targetConcepts: [
          'Single Responsibility: decoupled fee calculation and ticket issuing',
          'Interface Segregation: client-focused contracts without bloated interfaces',
          'Liskov Substitution: vehicle/spot hierarchies maintain substitutability',
        ],
      },
      {
        id: 'extensibility_patterns',
        title: 'Extensibility & Pattern Application',
        weight: 25,
        description:
          'Evaluates appropriate use of design patterns (such as Strategy for spot allocation or pricing, Factory for vehicle/spot creation) and openness to future extension.',
        targetConcepts: [
          'Strategy pattern for spot assignment or fee calculation',
          'Factory pattern for vehicle or spot instantiation',
          'Extensible contract for introducing new vehicle or pricing rules',
        ],
      },
      {
        id: 'edge_cases_concurrency',
        title: 'Edge Cases & Allocation Robustness',
        weight: 25,
        description:
          'Evaluates coverage of real-world operational constraints: full capacity handling, concurrent gate allocation conflicts, and ticket lifecycle validity.',
        targetConcepts: [
          'Full lot capacity detection and rejection behavior',
          'Concurrent entrance gate allocation collision prevention',
          'Ticket validation (lost ticket, already unparked, invalid spot)',
        ],
      },
    ],
  },
  starterTemplate: {
    problemSlug: 'parking-lot',
    assumptions: [
      'Multi-floor parking facility with separate gates for entry and exit.',
      'Hourly billing rate varies by vehicle type (Motorcycle, Car, Truck).',
    ],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: [
          'Manages multiple floors and entry/exit gates',
          'Coordinates vehicle entry and ticket generation',
        ],
        attributes: ['id: string', 'name: string', 'floors: ParkingFloor[]'],
        methods: ['parkVehicle(vehicle: Vehicle): Ticket', 'unparkVehicle(ticket: Ticket): number'],
      },
      {
        name: 'ParkingFloor',
        type: 'class',
        responsibilities: ['Tracks parking spots and availability on a specific floor'],
        attributes: ['floorNumber: number', 'spots: ParkingSpot[]'],
        methods: ['getAvailableSpots(): ParkingSpot[]'],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: ['Maintains individual spot size and occupancy state'],
        attributes: ['spotId: string', 'isOccupied: boolean', 'spotType: string'],
        methods: ['occupy(vehicle: Vehicle): void', 'vacate(): void'],
      },
      {
        name: 'Vehicle',
        type: 'abstract_class',
        responsibilities: ['Base entity representing any vehicle entering the lot'],
        attributes: ['licensePlate: string', 'vehicleType: string'],
        methods: ['getVehicleType(): string'],
      },
      {
        name: 'Ticket',
        type: 'class',
        responsibilities: ['Records entry time, assigned spot, and vehicle details'],
        attributes: ['ticketId: string', 'entryTime: Date', 'spotId: string', 'isPaid: boolean'],
        methods: ['markPaid(): void'],
      },
    ],
    relationships: [
      {
        source: 'ParkingLot',
        target: 'ParkingFloor',
        type: 'has_many',
        description: 'ParkingLot contains one or more ParkingFloors',
      },
      {
        source: 'ParkingFloor',
        target: 'ParkingSpot',
        type: 'has_many',
        description: 'ParkingFloor manages a collection of ParkingSpots',
      },
      {
        source: 'Ticket',
        target: 'ParkingSpot',
        type: 'has_a',
        description: 'Ticket references the assigned ParkingSpot',
      },
    ],
    designPatterns: [
      {
        patternName: 'Singleton',
        targetEntity: 'ParkingLot',
        justification: 'Ensures a single central access point for managing facility-wide state.',
      },
    ],
    edgeCasesConsidered: [
      'Lot full condition: system displays full sign and rejects vehicles when no compatible spots are vacant.',
    ],
  },
  sampleSolution: {
    problemSlug: 'parking-lot',
    assumptions: [
      'Multi-level structure with entry and exit gates operating simultaneously.',
      'Three vehicle categories: Motorcycle (Small), Car (Medium), and Truck/Bus (Large).',
      'Flat fee for the first hour, progressive hourly rate thereafter based on vehicle classification.',
    ],
    entities: [
      {
        name: 'ParkingLot',
        type: 'class',
        responsibilities: [
          'High-level facility facade orchestrating gates, floors, and strategies',
          'Delegates spot search to SpotAssignmentStrategy',
          'Delegates fee calculation to FeeCalculationStrategy',
        ],
        attributes: [
          'id: string',
          'floors: ParkingFloor[]',
          'assignmentStrategy: SpotAssignmentStrategy',
          'feeStrategy: FeeCalculationStrategy',
        ],
        methods: [
          'processEntry(vehicle: Vehicle): ParkingTicket',
          'processExit(ticket: ParkingTicket): Receipt',
        ],
      },
      {
        name: 'ParkingFloor',
        type: 'class',
        responsibilities: [
          'Manages spot inventory and availability count by SpotType on a specific level',
          'Updates display board metrics upon spot state change',
        ],
        attributes: ['floorNumber: number', 'spots: ParkingSpot[]'],
        methods: ['findFreeSpot(type: SpotType): ParkingSpot', 'getVacantCount(type: SpotType): number'],
      },
      {
        name: 'ParkingSpot',
        type: 'class',
        responsibilities: [
          'Encapsulates individual spot reservation, occupancy status, and size constraints',
        ],
        attributes: ['spotNumber: string', 'spotType: SpotType', 'isFree: boolean', 'currentVehicle: Vehicle'],
        methods: ['assignVehicle(vehicle: Vehicle): boolean', 'removeVehicle(): void'],
      },
      {
        name: 'Vehicle',
        type: 'abstract_class',
        responsibilities: ['Abstract base representing vehicles with distinct size requirements'],
        attributes: ['licensePlate: string', 'vehicleType: VehicleType'],
        methods: ['getRequiredSpotType(): SpotType'],
      },
      {
        name: 'ParkingTicket',
        type: 'class',
        responsibilities: [
          'Immutable record of vehicle admission, designated spot, and issuance timestamp',
        ],
        attributes: [
          'ticketNumber: string',
          'issuedAt: Date',
          'allocatedSpot: ParkingSpot',
          'licensePlate: string',
          'status: TicketStatus',
        ],
        methods: ['closeTicket(exitTime: Date): void'],
      },
      {
        name: 'Receipt',
        type: 'class',
        responsibilities: ['Represents completed payment audit with duration and amount billed'],
        attributes: ['receiptId: string', 'ticketNumber: string', 'amountPaid: number', 'paidAt: Date'],
        methods: [],
      },
      {
        name: 'SpotAssignmentStrategy',
        type: 'interface',
        responsibilities: [
          'Defines contract for locating optimal available spot across floors (e.g. Nearest, Best-Fit)',
        ],
        attributes: [],
        methods: ['findSpot(floors: ParkingFloor[], type: SpotType): ParkingSpot'],
      },
      {
        name: 'NearestSpotStrategy',
        type: 'class',
        responsibilities: [
          'Implements spot assignment by scanning lowest floor and nearest index to entrance',
        ],
        attributes: [],
        methods: ['findSpot(floors: ParkingFloor[], type: SpotType): ParkingSpot'],
      },
      {
        name: 'FeeCalculationStrategy',
        type: 'interface',
        responsibilities: [
          'Defines pluggable contract for parking fee calculation based on duration and vehicle rate',
        ],
        attributes: [],
        methods: ['calculateFee(ticket: ParkingTicket, exitTime: Date): number'],
      },
      {
        name: 'StandardFeeCalculator',
        type: 'class',
        responsibilities: [
          'Computes progressive hourly fee based on VehicleType pricing tiers',
        ],
        attributes: ['baseRatePerHour: Map<VehicleType, number>'],
        methods: ['calculateFee(ticket: ParkingTicket, exitTime: Date): number'],
      },
    ],
    relationships: [
      {
        source: 'ParkingLot',
        target: 'ParkingFloor',
        type: 'has_many',
        description: 'ParkingLot coordinates multiple ParkingFloors',
      },
      {
        source: 'ParkingFloor',
        target: 'ParkingSpot',
        type: 'has_many',
        description: 'ParkingFloor aggregates individual ParkingSpots',
      },
      {
        source: 'ParkingLot',
        target: 'SpotAssignmentStrategy',
        type: 'uses',
        description: 'ParkingLot delegates spot allocation algorithm via Strategy interface',
      },
      {
        source: 'NearestSpotStrategy',
        target: 'SpotAssignmentStrategy',
        type: 'implements',
        description: 'Concrete nearest-to-gate spot allocation algorithm',
      },
      {
        source: 'ParkingLot',
        target: 'FeeCalculationStrategy',
        type: 'uses',
        description: 'ParkingLot delegates fee computation via Strategy interface',
      },
      {
        source: 'StandardFeeCalculator',
        target: 'FeeCalculationStrategy',
        type: 'implements',
        description: 'Concrete tiered pricing calculation implementation',
      },
      {
        source: 'ParkingTicket',
        target: 'ParkingSpot',
        type: 'has_a',
        description: 'ParkingTicket maintains reference to the reserved spot',
      },
      {
        source: 'Receipt',
        target: 'ParkingTicket',
        type: 'uses',
        description: 'Receipt references the completed parking ticket',
      },
    ],
    designPatterns: [
      {
        patternName: 'Strategy Pattern',
        targetEntity: 'SpotAssignmentStrategy',
        justification:
          'Allows the parking lot to swap spot selection algorithms (e.g. NearestSpot vs BestFit) without modifying core lot orchestration.',
      },
      {
        patternName: 'Strategy Pattern',
        targetEntity: 'FeeCalculationStrategy',
        justification:
          'Decouples rate and tariff calculation from the lot coordinator, allowing weekend surge or event pricing to be introduced cleanly.',
      },
      {
        patternName: 'Facade Pattern',
        targetEntity: 'ParkingLot',
        justification:
          'Presents a unified, simple API (processEntry, processExit) to entry/exit terminal clients while hiding underlying floor/spot complexity.',
      },
    ],
    edgeCasesConsidered: [
      'Concurrent gate entry conflict: Spot reservation performs an atomic check-and-set or lock on the spot to prevent multiple gates assigning the same slot simultaneously.',
      'Capacity saturation: Displays real-time FULL indicator per floor and blocks ticket creation when compatible spots reach zero.',
      'Lost ticket handling: System provides a fallback unparking mechanism applying standard maximum daily penalty rate.',
    ],
  },
};
