import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

/**
 * Safely masks credentials in MongoDB connection URIs to prevent leaking secrets in logs.
 */
export function sanitizeMongoUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return uri.replace(/:([^:@/\s]+)@/g, ':****@');
  }
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/:([^:@/\s]+)@/g, ':****@');
}

export async function connectDB(): Promise<boolean> {
  // If already connected, return
  if (isConnected) return true;

  const isAtlas = env.MONGODB_URI.startsWith('mongodb+srv://');
  const timeoutMs = isAtlas ? 5000 : 2000;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: timeoutMs,
    });
    isConnected = true;
    const dbName = conn.connection.name || 'default';
    const dbHost = conn.connection.host || 'unknown';
    console.log(`[MongoDB] Connected to database "${dbName}" at ${dbHost}`);
    return true;
  } catch (error) {
    isConnected = false;
    const safeUri = sanitizeMongoUri(env.MONGODB_URI);
    const safeError = sanitizeErrorMessage(error);
    // Log friendly notice, but do not exit process so server runs in standalone mode
    console.warn(
      `[MongoDB] Standalone mode: Could not connect to MongoDB at "${safeUri}". The API server will continue running without database persistence.`
    );
    console.warn(`[MongoDB] Reason: ${safeError}`);
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
