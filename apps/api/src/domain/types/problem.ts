import { StructuredDesign } from '../schemas/submission';

export interface RubricCriterion {
  id: string;
  title: string;
  weight: number;
  description: string;
  targetConcepts: string[];
}

export interface Rubric {
  id: string;
  criteria: RubricCriterion[];
  totalWeight: number;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  summary: string;
  description: string;
  functionalRequirements: string[];
  nonFunctionalConstraints: string[];
  rubric: Rubric;
  starterTemplate: StructuredDesign;
  sampleSolution: StructuredDesign;
}
