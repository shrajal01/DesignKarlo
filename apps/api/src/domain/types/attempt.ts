import type { StructuredDesign } from '../schemas/submission';
import type { Evaluation } from './evaluation';

export type AttemptStatus = 'in_progress' | 'completed';

export interface Attempt {
  id: string;
  problemSlug: string;
  anonymousUserId: string;
  status: AttemptStatus;
  currentRevisionNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  attemptId: string;
  revisionNumber: number;
  design: StructuredDesign;
  evaluation?: Evaluation;
  parentSubmissionId?: string;
  submittedAt: string;
}
