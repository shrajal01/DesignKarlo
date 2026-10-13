import { Problem } from '../types/problem';
import { parkingLotProblem } from './parkingLot';

const problemRegistry: Map<string, Problem> = new Map([
  [parkingLotProblem.slug, parkingLotProblem],
]);

export function listProblems(): Problem[] {
  return Array.from(problemRegistry.values());
}

export function getProblemBySlug(slug: string): Problem | undefined {
  return problemRegistry.get(slug);
}

export function isValidProblemSlug(slug: string): boolean {
  return problemRegistry.has(slug);
}

export { parkingLotProblem };
