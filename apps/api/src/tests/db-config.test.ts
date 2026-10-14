import { describe, it, expect } from 'vitest';
import { sanitizeMongoUri } from '../config/db';

describe('MongoDB Configuration & URI Sanitization', () => {
  it('masks credentials in MongoDB Atlas mongodb+srv URIs', () => {
    const raw = 'mongodb+srv://db_user:SuperSecretPassword123@designkarlo.fjjjxjv.mongodb.net/?appName=DesignKarlo';
    const sanitized = sanitizeMongoUri(raw);

    expect(sanitized).not.toContain('SuperSecretPassword123');
    expect(sanitized).toBe('mongodb+srv://db_user:****@designkarlo.fjjjxjv.mongodb.net/?appName=DesignKarlo');
  });

  it('masks credentials in standard mongodb:// URIs with port', () => {
    const raw = 'mongodb://app_user:mypassword@127.0.0.1:27017/designkarlo';
    const sanitized = sanitizeMongoUri(raw);

    expect(sanitized).not.toContain('mypassword');
    expect(sanitized).toBe('mongodb://app_user:****@127.0.0.1:27017/designkarlo');
  });

  it('leaves URIs without credentials intact', () => {
    const localhostUri = 'mongodb://localhost:27017/designkarlo';
    expect(sanitizeMongoUri(localhostUri)).toBe(localhostUri);
  });
});
