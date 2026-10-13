import type { Attempt, Submission } from '../domain';

export interface IAttemptRepository {
  createAttempt(data: {
    problemSlug: string;
    anonymousUserId: string;
  }): Promise<Attempt>;

  getAttemptById(id: string): Promise<Attempt | null>;

  getAttemptsByUserId(userId: string): Promise<Attempt[]>;

  updateAttempt(
    id: string,
    data: Partial<Pick<Attempt, 'status' | 'currentRevisionNumber'>>
  ): Promise<Attempt | null>;

  createSubmission(data: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission>;

  getSubmissionsByAttemptId(attemptId: string): Promise<Submission[]>;

  getSubmissionById(id: string): Promise<Submission | null>;

  getLatestSubmission(attemptId: string): Promise<Submission | null>;

  getPersistenceMode(): 'in-memory' | 'mongodb';
}
