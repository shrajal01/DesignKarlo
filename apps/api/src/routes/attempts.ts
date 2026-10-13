import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { attemptService } from '../services/attemptService';
import { StructuredDesignSchema } from '../domain';
import { AppError } from '../middleware/errorHandler';

export const attemptsRouter = Router();

const createAttemptSchema = z.object({
  problemSlug: z.string().trim().min(1, 'Problem slug is required'),
  anonymousUserId: z.string().trim().min(1, 'Anonymous user ID is required'),
});

attemptsRouter.post('/attempts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = createAttemptSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid attempt parameters',
          code: 'VALIDATION_ERROR',
          details: parseResult.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    const { problemSlug, anonymousUserId } = parseResult.data;
    const result = await attemptService.startOrResumeAttempt(problemSlug, anonymousUserId);

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      data: result.attempt,
      meta: {
        isNew: result.isNew,
      },
    });
  } catch (error) {
    next(error);
  }
});

attemptsRouter.get('/attempts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      throw new AppError('Query parameter "userId" is required', 400, 'MISSING_USER_ID');
    }

    const attempts = await attemptService.getUserAttempts(userId);
    res.status(200).json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    next(error);
  }
});

attemptsRouter.get('/attempts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await attemptService.getAttemptDetails(req.params.id);
    res.setHeader('X-Persistence-Mode', result.persistenceMode);
    res.status(200).json({
      success: true,
      data: {
        ...result.attempt,
        submissions: result.submissions,
      },
      meta: {
        persistenceMode: result.persistenceMode,
      },
    });
  } catch (error) {
    next(error);
  }
});

attemptsRouter.post(
  '/attempts/:id/submissions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parseResult = StructuredDesignSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Design submission validation failed',
            code: 'VALIDATION_ERROR',
            details: parseResult.error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }

      const result = await attemptService.submitDesign(req.params.id, parseResult.data);
      res.setHeader('X-Persistence-Mode', result.persistenceMode);
      res.status(result.isDuplicate ? 200 : 201).json({
        success: true,
        data: result.submission,
        meta: {
          isDuplicate: result.isDuplicate,
          persistenceMode: result.persistenceMode,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

attemptsRouter.get(
  '/attempts/:id/submissions/:subId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await attemptService.getSubmission(req.params.id, req.params.subId);
      res.setHeader('X-Persistence-Mode', result.persistenceMode);
      res.status(200).json({
        success: true,
        data: result.submission,
        meta: {
          persistenceMode: result.persistenceMode,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

attemptsRouter.get(
  '/attempts/:id/compare',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const revAStr = req.query.revA as string;
      const revBStr = req.query.revB as string;

      if (!revAStr || !revBStr) {
        throw new AppError(
          'Query parameters "revA" and "revB" are required for comparison',
          400,
          'MISSING_REVISION_PARAMS'
        );
      }

      const revA = parseInt(revAStr, 10);
      const revB = parseInt(revBStr, 10);

      if (isNaN(revA) || isNaN(revB) || revA <= 0 || revB <= 0) {
        throw new AppError('Revisions revA and revB must be positive integers', 400, 'INVALID_REVISION_PARAMS');
      }

      const result = await attemptService.compareRevisions(req.params.id, revA, revB);
      res.setHeader('X-Persistence-Mode', result.persistenceMode);
      res.status(200).json({
        success: true,
        data: {
          comparison: result.comparison,
          revisionA: {
            revisionNumber: result.submissionA.revisionNumber,
            overallScore: result.submissionA.evaluation?.overallScore,
            submittedAt: result.submissionA.submittedAt,
          },
          revisionB: {
            revisionNumber: result.submissionB.revisionNumber,
            overallScore: result.submissionB.evaluation?.overallScore,
            submittedAt: result.submissionB.submittedAt,
          },
        },
        meta: {
          persistenceMode: result.persistenceMode,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
