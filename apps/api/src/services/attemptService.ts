import crypto from 'crypto';
import {
  getProblemBySlug,
  deterministicEvaluator,
  type StructuredDesign,
  type Attempt,
  type Submission,
  type ComparisonSummary,
} from '../domain';
import { getRepository } from '../repositories';
import { AppError } from '../middleware/errorHandler';

interface RecentSubmissionCache {
  hash: string;
  timestamp: number;
  submission: Submission;
}

// In-memory cache for duplicate protection within 5-second window
const recentSubmissionsCache = new Map<string, RecentSubmissionCache>();

function hashPayload(attemptId: string, design: StructuredDesign): string {
  const normalized = JSON.stringify(design);
  return crypto.createHash('sha256').update(`${attemptId}:${normalized}`).digest('hex');
}

export const attemptService = {
  async startOrResumeAttempt(
    problemSlug: string,
    anonymousUserId: string
  ): Promise<{ attempt: Attempt; isNew: boolean }> {
    const problem = getProblemBySlug(problemSlug);
    if (!problem) {
      throw new AppError(`Problem with slug "${problemSlug}" not found`, 404, 'PROBLEM_NOT_FOUND');
    }

    const repo = getRepository();
    const existing = await repo.getAttemptsByUserId(anonymousUserId);
    const active = existing.find(
      (a) => a.problemSlug === problemSlug && a.status === 'in_progress'
    );

    if (active) {
      return { attempt: active, isNew: false };
    }

    const newAttempt = await repo.createAttempt({
      problemSlug,
      anonymousUserId,
    });

    return { attempt: newAttempt, isNew: true };
  },

  async getAttemptDetails(attemptId: string): Promise<{
    attempt: Attempt;
    submissions: Submission[];
    persistenceMode: 'in-memory' | 'mongodb';
  }> {
    const repo = getRepository();
    const attempt = await repo.getAttemptById(attemptId);
    if (!attempt) {
      throw new AppError(`Attempt "${attemptId}" not found`, 404, 'ATTEMPT_NOT_FOUND');
    }

    const submissions = await repo.getSubmissionsByAttemptId(attemptId);
    return {
      attempt,
      submissions,
      persistenceMode: repo.getPersistenceMode(),
    };
  },

  async getUserAttempts(anonymousUserId: string): Promise<Attempt[]> {
    const repo = getRepository();
    return repo.getAttemptsByUserId(anonymousUserId);
  },

  async submitDesign(
    attemptId: string,
    design: StructuredDesign
  ): Promise<{
    submission: Submission;
    isDuplicate: boolean;
    persistenceMode: 'in-memory' | 'mongodb';
  }> {
    const repo = getRepository();
    const attempt = await repo.getAttemptById(attemptId);
    if (!attempt) {
      throw new AppError(`Attempt "${attemptId}" not found`, 404, 'ATTEMPT_NOT_FOUND');
    }

    const problem = getProblemBySlug(attempt.problemSlug);
    if (!problem) {
      throw new AppError(
        `Problem "${attempt.problemSlug}" associated with this attempt was not found`,
        404,
        'PROBLEM_NOT_FOUND'
      );
    }

    // 1. Check for duplicate submission within 5-second window
    const payloadHash = hashPayload(attemptId, design);
    const cached = recentSubmissionsCache.get(attemptId);
    const now = Date.now();

    if (cached && cached.hash === payloadHash && now - cached.timestamp <= 5000) {
      return {
        submission: cached.submission,
        isDuplicate: true,
        persistenceMode: repo.getPersistenceMode(),
      };
    }

    // 2. Determine previous revision and parent reference
    const latestSubmission = await repo.getLatestSubmission(attemptId);
    const nextRevisionNumber = (latestSubmission?.revisionNumber || 0) + 1;
    const parentSubmissionId = latestSubmission?.id;

    // 3. Evaluate design against the problem rubric
    const submissionTempId = `sub_${Date.now()}`;
    const evaluation = deterministicEvaluator.evaluate(design, problem, {
      submissionId: submissionTempId,
      previousEvaluation: latestSubmission?.evaluation,
      previousRevisionNumber: latestSubmission?.revisionNumber,
    });

    // 4. Persist immutable submission record
    const createdSubmission = await repo.createSubmission({
      attemptId,
      revisionNumber: nextRevisionNumber,
      design,
      evaluation,
      parentSubmissionId,
    });

    // Update submissionId in evaluation to match created ID
    if (createdSubmission.evaluation) {
      createdSubmission.evaluation.submissionId = createdSubmission.id;
    }

    // 5. Update attempt revision pointer
    await repo.updateAttempt(attemptId, {
      currentRevisionNumber: nextRevisionNumber,
    });

    // 6. Record in duplicate cache
    recentSubmissionsCache.set(attemptId, {
      hash: payloadHash,
      timestamp: now,
      submission: createdSubmission,
    });

    return {
      submission: createdSubmission,
      isDuplicate: false,
      persistenceMode: repo.getPersistenceMode(),
    };
  },

  async getSubmission(
    attemptId: string,
    submissionId: string
  ): Promise<{
    submission: Submission;
    persistenceMode: 'in-memory' | 'mongodb';
  }> {
    const repo = getRepository();
    const submission = await repo.getSubmissionById(submissionId);
    if (!submission || submission.attemptId !== attemptId) {
      throw new AppError(`Submission "${submissionId}" not found for this attempt`, 404, 'SUBMISSION_NOT_FOUND');
    }

    return {
      submission,
      persistenceMode: repo.getPersistenceMode(),
    };
  },

  async compareRevisions(
    attemptId: string,
    revA: number,
    revB: number
  ): Promise<{
    comparison: ComparisonSummary;
    submissionA: Submission;
    submissionB: Submission;
    persistenceMode: 'in-memory' | 'mongodb';
  }> {
    const repo = getRepository();
    const attempt = await repo.getAttemptById(attemptId);
    if (!attempt) {
      throw new AppError(`Attempt "${attemptId}" not found`, 404, 'ATTEMPT_NOT_FOUND');
    }

    const submissions = await repo.getSubmissionsByAttemptId(attemptId);
    const subA = submissions.find((s) => s.revisionNumber === revA);
    const subB = submissions.find((s) => s.revisionNumber === revB);

    if (!subA || !subA.evaluation) {
      throw new AppError(`Revision ${revA} not found or not evaluated`, 404, 'REVISION_NOT_FOUND');
    }
    if (!subB || !subB.evaluation) {
      throw new AppError(`Revision ${revB} not found or not evaluated`, 404, 'REVISION_NOT_FOUND');
    }

    const comparison = deterministicEvaluator.compareRevisions(
      subB.evaluation,
      subA.evaluation,
      revA
    );

    return {
      comparison,
      submissionA: subA,
      submissionB: subB,
      persistenceMode: repo.getPersistenceMode(),
    };
  },
};
