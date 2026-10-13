import { describe, it, expect, beforeEach } from 'vitest';
import { inMemoryAttemptRepository } from '../repositories/inMemoryAttemptRepository';
import { parkingLotProblem } from '../domain';

describe('InMemoryAttemptRepository', () => {
  beforeEach(() => {
    inMemoryAttemptRepository.clear();
  });

  it('declares in-memory persistence mode', () => {
    expect(inMemoryAttemptRepository.getPersistenceMode()).toBe('in-memory');
  });

  it('creates and retrieves an attempt by id', async () => {
    const attempt = await inMemoryAttemptRepository.createAttempt({
      problemSlug: 'parking-lot',
      anonymousUserId: 'usr_test_1',
    });

    expect(attempt.id).toMatch(/^att_/);
    expect(attempt.problemSlug).toBe('parking-lot');
    expect(attempt.anonymousUserId).toBe('usr_test_1');
    expect(attempt.currentRevisionNumber).toBe(0);

    const fetched = await inMemoryAttemptRepository.getAttemptById(attempt.id);
    expect(fetched).toEqual(attempt);
  });

  it('returns null for non-existent attempt id', async () => {
    const fetched = await inMemoryAttemptRepository.getAttemptById('att_non_existent');
    expect(fetched).toBeNull();
  });

  it('lists attempts filtered by anonymous user id', async () => {
    await inMemoryAttemptRepository.createAttempt({
      problemSlug: 'parking-lot',
      anonymousUserId: 'user_a',
    });
    await inMemoryAttemptRepository.createAttempt({
      problemSlug: 'parking-lot',
      anonymousUserId: 'user_b',
    });

    const userAAttempts = await inMemoryAttemptRepository.getAttemptsByUserId('user_a');
    expect(userAAttempts).toHaveLength(1);
    expect(userAAttempts[0].anonymousUserId).toBe('user_a');
  });

  it('creates and lists immutable submissions in revision order', async () => {
    const attempt = await inMemoryAttemptRepository.createAttempt({
      problemSlug: 'parking-lot',
      anonymousUserId: 'user_c',
    });

    const sub1 = await inMemoryAttemptRepository.createSubmission({
      attemptId: attempt.id,
      revisionNumber: 1,
      design: parkingLotProblem.starterTemplate,
    });

    const sub2 = await inMemoryAttemptRepository.createSubmission({
      attemptId: attempt.id,
      revisionNumber: 2,
      design: parkingLotProblem.sampleSolution,
      parentSubmissionId: sub1.id,
    });

    const submissions = await inMemoryAttemptRepository.getSubmissionsByAttemptId(attempt.id);
    expect(submissions).toHaveLength(2);
    expect(submissions[0].revisionNumber).toBe(1);
    expect(submissions[1].revisionNumber).toBe(2);

    const latest = await inMemoryAttemptRepository.getLatestSubmission(attempt.id);
    expect(latest?.id).toBe(sub2.id);
  });
});
