import { createApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

async function bootstrap() {
  const app = createApp();

  // Attempt database connection in the background; does not block server startup
  connectDB().catch((err) => {
    console.warn('[MongoDB] Initial connection attempt error:', err.message);
  });

  const server = app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 DesignKarlo API Server Running`);
    console.log(`📡 URL: http://localhost:${env.PORT}`);
    console.log(`🩺 Health: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`===============================================`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
