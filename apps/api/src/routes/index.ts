import { Router } from 'express';
import { healthRouter } from './health';
import { problemsRouter } from './problems';
import { attemptsRouter } from './attempts';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(problemsRouter);
apiRouter.use(attemptsRouter);
