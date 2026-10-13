import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  // If already connected, return
  if (isConnected) return true;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000, // Fast timeout so server startup is not blocked
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    // Log friendly notice, but do not exit process so server runs in standalone mode
    console.warn(
      `[MongoDB] Standalone mode: Could not connect to MongoDB at "${env.MONGODB_URI}". The API server will continue running without database persistence.`
    );
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
