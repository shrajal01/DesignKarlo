import { Router, Request, Response, NextFunction } from 'express';
import { listProblems, getProblemBySlug } from '../domain';
import { AppError } from '../middleware/errorHandler';

export const problemsRouter = Router();

problemsRouter.get('/problems', (req: Request, res: Response) => {
  const problems = listProblems();
  res.status(200).json({
    success: true,
    data: problems.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      summary: p.summary,
      rubricDimensions: p.rubric.criteria.map((c) => ({
        id: c.id,
        title: c.title,
        weight: c.weight,
      })),
    })),
  });
});

problemsRouter.get('/problems/:slug', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const problem = getProblemBySlug(slug);
    if (!problem) {
      throw new AppError(`Problem with slug "${slug}" not found`, 404, 'PROBLEM_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: problem,
    });
  } catch (error) {
    next(error);
  }
});
