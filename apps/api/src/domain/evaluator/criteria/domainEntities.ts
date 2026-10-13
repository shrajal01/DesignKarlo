import type { StructuredDesign } from '../../schemas/submission';
import type { CriterionScore, FeedbackItem, ScoreRating } from '../../types/evaluation';

export function evaluateDomainEntities(design: StructuredDesign): {
  score: CriterionScore;
  feedback: FeedbackItem[];
} {
  const feedback: FeedbackItem[] = [];
  const entities = design.entities;

  // Helper: search entities by flexible regex pattern matching
  const findEntitiesMatching = (pattern: RegExp) =>
    entities.filter(
      (e) =>
        pattern.test(e.name) ||
        e.responsibilities.some((r) => pattern.test(r)) ||
        e.attributes.some((a) => pattern.test(a))
    );

  // 1. Vehicle representation (Max: 6 pts)
  const vehicleMatches = findEntitiesMatching(/vehicle|car|bike|truck|motorcycle|van|automobile/i);
  let vehicleScore = 0;
  if (vehicleMatches.length > 0) {
    const matchedNames = vehicleMatches.map((e) => e.name).join(', ');
    const hasSpecializedTypes =
      vehicleMatches.length > 1 ||
      vehicleMatches.some((e) => e.type === 'abstract_class' || e.type === 'interface');
    vehicleScore = hasSpecializedTypes ? 6 : 4;

    feedback.push({
      id: 'fb_ent_vehicle_found',
      criterionId: 'domain_entities',
      type: 'strength',
      title: 'Vehicle Concept Modeled',
      evidence: `Found vehicle abstraction(s): ${matchedNames}`,
      impact:
        'Allows the system to identify distinct vehicle categories and map them to appropriate parking requirements.',
      suggestion: hasSpecializedTypes
        ? 'Maintain this vehicle polymorphism as new vehicle classifications are introduced.'
        : 'Consider defining an abstract class or interface for Vehicle to support diverse vehicle types polymorphically.',
      priority: 'low',
    });
  } else {
    vehicleScore = 0;
    feedback.push({
      id: 'fb_ent_vehicle_missing',
      criterionId: 'domain_entities',
      type: 'concern',
      title: 'Missing Vehicle Abstraction',
      evidence: 'No entity representing vehicles, cars, or motorcycles was declared in the design.',
      impact:
        'Without a vehicle model, spot size validation and vehicle-specific tariffs cannot be assigned reliably.',
      suggestion:
        'Introduce an abstract Vehicle class or interface with concrete types (e.g., Car, Motorcycle, Truck).',
      priority: 'high',
    });
  }

  // 2. Spot / Space / Slot representation (Max: 7 pts)
  const spotMatches = findEntitiesMatching(/spot|slot|space|bay/i);
  const floorMatches = findEntitiesMatching(/floor|level|deck/i);
  let spotScore = 0;
  if (spotMatches.length > 0) {
    const hasFloorAggregation = floorMatches.length > 0;
    spotScore = hasFloorAggregation ? 7 : 5;

    const spotNames = spotMatches.map((e) => e.name).join(', ');
    feedback.push({
      id: 'fb_ent_spot_found',
      criterionId: 'domain_entities',
      type: 'strength',
      title: 'Parking Spot Abstraction Modeled',
      evidence: `Found spot abstraction: ${spotNames}${hasFloorAggregation ? ` organized by ${floorMatches.map((e) => e.name).join(', ')}` : ''}`,
      impact:
        'Encapsulates spot availability status, size compatibility, and physical location within the structure.',
      suggestion: hasFloorAggregation
        ? 'Good multi-floor organization. Ensure spot state transitions (occupy/vacate) remain encapsulated.'
        : 'Consider introducing a Floor or Level entity to model multi-story capacity tracking cleanly.',
      priority: 'low',
    });
  } else {
    spotScore = 1;
    feedback.push({
      id: 'fb_ent_spot_missing',
      criterionId: 'domain_entities',
      type: 'concern',
      title: 'Missing Dedicated Spot/Slot Abstraction',
      evidence: 'No entity explicitly encapsulating individual parking spaces or slots was declared.',
      impact:
        'Managing spot occupancy directly on the top-level lot leads to coarse state tracking and high contention.',
      suggestion:
        'Model a ParkingSpot entity that encapsulates spot size, occupancy state, and reservation logic.',
      priority: 'high',
    });
  }

  // 3. Ticket / Transaction / Receipt representation (Max: 6 pts)
  const ticketMatches = findEntitiesMatching(/ticket|receipt|pass|token|session|reservation|invoice/i);
  let ticketScore = 0;
  if (ticketMatches.length > 0) {
    ticketScore = 6;
    const ticketNames = ticketMatches.map((e) => e.name).join(', ');
    feedback.push({
      id: 'fb_ent_ticket_found',
      criterionId: 'domain_entities',
      type: 'strength',
      title: 'Parking Transaction / Ticket Concept Modeled',
      evidence: `Found transaction entity: ${ticketNames}`,
      impact:
        'Tracks the lifecycle of vehicle admission, entry timestamp, spot assignment, and payment status.',
      suggestion:
        'Ensure the ticket acts as an immutable record of admission and fee settlement upon vehicle departure.',
      priority: 'low',
    });
  } else {
    ticketScore = 1;
    feedback.push({
      id: 'fb_ent_ticket_missing',
      criterionId: 'domain_entities',
      type: 'concern',
      title: 'Missing Ticket / Admission Transaction Record',
      evidence: 'No entity representing a ParkingTicket, Token, or Receipt was identified.',
      impact:
        'Without a ticket entity, tracking duration of stay and calculating exit fees becomes ambiguous.',
      suggestion:
        'Introduce a ParkingTicket class holding entry timestamp, vehicle reference, assigned spot, and payment state.',
      priority: 'high',
    });
  }

  // 4. Coordinator / Facility representation (Max: 6 pts)
  const coordinatorMatches = findEntitiesMatching(/parkinglot|garage|facility|parkingsystem|manager|gate/i);
  let coordinatorScore = 0;
  if (coordinatorMatches.length > 0) {
    coordinatorScore = 6;
    const coordNames = coordinatorMatches.map((e) => e.name).join(', ');
    feedback.push({
      id: 'fb_ent_coord_found',
      criterionId: 'domain_entities',
      type: 'strength',
      title: 'Facility Coordinator Modeled',
      evidence: `Found central facility abstraction: ${coordNames}`,
      impact:
        'Provides a clear entry point for dispatching gate operations and coordinating structural subcomponents.',
      suggestion:
        'Ensure the coordinator delegates specialized algorithms rather than accumulating excessive responsibilities.',
      priority: 'low',
    });
  } else {
    coordinatorScore = 2;
    feedback.push({
      id: 'fb_ent_coord_missing',
      criterionId: 'domain_entities',
      type: 'concern',
      title: 'Missing Facility Coordinator / Entry Point',
      evidence: 'No overarching ParkingLot, Garage, or Facility facade entity was declared.',
      impact: 'Lacks a cohesive architectural boundary to coordinate entry/exit flows and floor states.',
      suggestion:
        'Create a ParkingLot or Garage facade class to serve as the unified coordination interface.',
      priority: 'medium',
    });
  }

  const rawTotal = vehicleScore + spotScore + ticketScore + coordinatorScore;
  const totalScore = Math.min(25, Math.max(0, rawTotal));

  let rating: ScoreRating = 'Missing';
  if (totalScore >= 21) rating = 'Excellent';
  else if (totalScore >= 16) rating = 'Good';
  else if (totalScore >= 10) rating = 'Needs Improvement';

  return {
    score: {
      criterionId: 'domain_entities',
      title: 'Core Entity Decomposition',
      score: totalScore,
      maxScore: 25,
      rating,
      summary: `Identified domain coverage: ${vehicleMatches.length > 0 ? 'Vehicle ✓' : 'Vehicle ✗'}, ${spotMatches.length > 0 ? 'Spot ✓' : 'Spot ✗'}, ${ticketMatches.length > 0 ? 'Ticket ✓' : 'Ticket ✗'}, ${coordinatorMatches.length > 0 ? 'Facility ✓' : 'Facility ✗'}.`,
    },
    feedback,
  };
}
