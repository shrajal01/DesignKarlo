import type { Attempt, Submission } from '../domain';
import type { IAttemptRepository } from './types';

export class InMemoryAttemptRepository implements IAttemptRepository {
  private attempts = new Map<string, Attempt>();
  private submissions = new Map<string, Submission>();
  private attemptSubmissions = new Map<string, string[]>();

  public getPersistenceMode(): 'in-memory' | 'mongodb' {
    return 'in-memory';
  }

  public async createAttempt(data: {
    problemSlug: string;
    anonymousUserId: string;
  }): Promise<Attempt> {
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const attempt: Attempt = {
      id,
      problemSlug: data.problemSlug,
      anonymousUserId: data.anonymousUserId,
      status: 'in_progress',
      currentRevisionNumber: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.attempts.set(id, attempt);
    this.attemptSubmissions.set(id, []);
    return { ...attempt };
  }

  public async getAttemptById(id: string): Promise<Attempt | null> {
    const attempt = this.attempts.get(id);
    return attempt ? { ...attempt } : null;
  }

  public async getAttemptsByUserId(userId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values())
      .filter((a) => a.anonymousUserId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((a) => ({ ...a }));
  }

  public async updateAttempt(
    id: string,
    data: Partial<Pick<Attempt, 'status' | 'currentRevisionNumber'>>
  ): Promise<Attempt | null> {
    const attempt = this.attempts.get(id);
    if (!attempt) return null;

    const updated: Attempt = {
      ...attempt,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.attempts.set(id, updated);
    return { ...updated };
  }

  public async createSubmission(
    data: Omit<Submission, 'id' | 'submittedAt'>
  ): Promise<Submission> {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const submission: Submission = {
      ...data,
      id,
      submittedAt: now,
    };

    this.submissions.set(id, submission);

    const subList = this.attemptSubmissions.get(data.attemptId) || [];
    subList.push(id);
    this.attemptSubmissions.set(data.attemptId, subList);

    return { ...submission };
  }

  public async getSubmissionsByAttemptId(attemptId: string): Promise<Submission[]> {
    const subIds = this.attemptSubmissions.get(attemptId) || [];
    return subIds
      .map((id) => this.submissions.get(id))
      .filter((s): s is Submission => s !== undefined)
      .sort((a, b) => a.revisionNumber - b.revisionNumber)
      .map((s) => ({ ...s }));
  }

  public async getSubmissionById(id: string): Promise<Submission | null> {
    const submission = this.submissions.get(id);
    return submission ? { ...submission } : null;
  }

  public async getLatestSubmission(attemptId: string): Promise<Submission | null> {
    const submissions = await this.getSubmissionsByAttemptId(attemptId);
    if (submissions.length === 0) return null;
    return submissions[submissions.length - 1];
  }

  public clear(): void {
    this.attempts.clear();
    this.submissions.clear();
    this.attemptSubmissions.clear();
  }
}

export const inMemoryAttemptRepository = new InMemoryAttemptRepository();
