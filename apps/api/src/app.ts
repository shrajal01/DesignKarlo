import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // CORS setup permitting Netlify deployment, preview deploys, and local development
  const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://designkarlo.netlify.app',
  ];

  const configuredOrigins = env.CLIENT_URL
    ? env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
    : [];

  const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...configuredOrigins]);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-side tests)
        if (!origin) {
          return callback(null, true);
        }
        const cleanOrigin = origin.replace(/\/+$/, '');
        if (allowedOriginsSet.has(cleanOrigin)) {
          return callback(null, true);
        }
        // Allow Netlify branch/preview deploys (*.netlify.app)
        if (/^https:\/\/[a-zA-Z0-9_-]+\.netlify\.app$/.test(cleanOrigin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin "${origin}" not allowed by CORS`));
      },
      credentials: true,
      exposedHeaders: ['X-Persistence-Mode', 'x-persistence-mode'],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use(env.API_PREFIX, apiRouter);

  // Fallback 404 and global error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
