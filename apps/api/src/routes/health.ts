import { Router, Request, Response } from 'express';
import { env } from '../config/env';
import { isDbConnected } from '../config/db';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  const dbConnected = isDbConnected();
  const persistenceMode = dbConnected ? 'mongodb' : 'in-memory';
  res.setHeader('X-Persistence-Mode', persistenceMode);
  res.status(200).json({
    status: 'ok',
    service: 'designkarlo-api',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: env.NODE_ENV,
    database: dbConnected ? 'connected' : 'disconnected (standalone mode)',
    persistenceMode,
  });
});
