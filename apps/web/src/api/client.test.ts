import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildApiUrl,
  getApiBaseUrl,
  api,
  getLastPersistenceMode,
  setLastPersistenceMode,
} from './client';

describe('Frontend API Client URL Builder & Health Persistence', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    setLastPersistenceMode('in-memory');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset import.meta.env properties
    (import.meta.env as Record<string, unknown>).VITE_API_URL = originalEnv.VITE_API_URL;
    (import.meta.env as Record<string, unknown>).PROD = originalEnv.PROD;
    (import.meta.env as Record<string, unknown>).DEV = originalEnv.DEV;
  });

  describe('buildApiUrl', () => {
    it('preserves absolute URLs without alteration', () => {
      expect(buildApiUrl('https://example.com/api/test')).toBe('https://example.com/api/test');
      expect(buildApiUrl('http://localhost:5000/api/problems')).toBe('http://localhost:5000/api/problems');
    });

    it('constructs correct API URL when VITE_API_URL has no trailing slash and no /api suffix', () => {
      (import.meta.env as Record<string, unknown>).VITE_API_URL = 'https://designkarlo-api.onrender.com';
      expect(buildApiUrl('/api/problems')).toBe('https://designkarlo-api.onrender.com/api/problems');
      expect(buildApiUrl('problems')).toBe('https://designkarlo-api.onrender.com/api/problems');
      expect(buildApiUrl('/api/attempts/att_123/submissions')).toBe(
        'https://designkarlo-api.onrender.com/api/attempts/att_123/submissions'
      );
    });

    it('safely strips trailing slashes from VITE_API_URL', () => {
      (import.meta.env as Record<string, unknown>).VITE_API_URL = 'https://designkarlo-api.onrender.com///';
      expect(buildApiUrl('/api/problems')).toBe('https://designkarlo-api.onrender.com/api/problems');
    });

    it('prevents accidental /api/api duplication if VITE_API_URL contains /api suffix', () => {
      (import.meta.env as Record<string, unknown>).VITE_API_URL = 'https://designkarlo-api.onrender.com/api';
      expect(buildApiUrl('/api/problems')).toBe('https://designkarlo-api.onrender.com/api/problems');
      expect(buildApiUrl('/api/health')).toBe('https://designkarlo-api.onrender.com/api/health');

      (import.meta.env as Record<string, unknown>).VITE_API_URL = 'https://designkarlo-api.onrender.com/api/';
      expect(buildApiUrl('/api/problems')).toBe('https://designkarlo-api.onrender.com/api/problems');
    });

    it('defaults to relative /api paths in development when VITE_API_URL is unset to use Vite proxy', () => {
      delete (import.meta.env as Record<string, unknown>).VITE_API_URL;
      (import.meta.env as Record<string, unknown>).PROD = false;
      (import.meta.env as Record<string, unknown>).DEV = true;

      expect(getApiBaseUrl()).toBe('');
      expect(buildApiUrl('/api/problems')).toBe('/api/problems');
      expect(buildApiUrl('problems')).toBe('/api/problems');
    });

    it('defaults to production Render backend URL in production when VITE_API_URL is unset', () => {
      delete (import.meta.env as Record<string, unknown>).VITE_API_URL;
      (import.meta.env as Record<string, unknown>).PROD = true;
      (import.meta.env as Record<string, unknown>).DEV = false;

      expect(getApiBaseUrl()).toBe('https://designkarlo-api.onrender.com');
      expect(buildApiUrl('/api/problems')).toBe('https://designkarlo-api.onrender.com/api/problems');
    });
  });

  describe('api.getHealth and Persistence Mode detection', () => {
    it('detects and sets mongodb persistence mode when database is connected', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({
            'x-persistence-mode': 'mongodb',
          }),
          json: () =>
            Promise.resolve({
              status: 'ok',
              service: 'designkarlo-api',
              environment: 'production',
              database: 'connected',
              persistenceMode: 'mongodb',
            }),
        })
      );

      const health = await api.getHealth();
      expect(health.status).toBe('ok');
      expect(health.database).toBe('connected');
      expect(getLastPersistenceMode()).toBe('mongodb');
    });

    it('detects and sets in-memory mode when database is disconnected', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({
            'x-persistence-mode': 'in-memory',
          }),
          json: () =>
            Promise.resolve({
              status: 'ok',
              service: 'designkarlo-api',
              environment: 'development',
              database: 'disconnected (standalone mode)',
              persistenceMode: 'in-memory',
            }),
        })
      );

      const health = await api.getHealth();
      expect(health.status).toBe('ok');
      expect(health.database).toContain('disconnected');
      expect(getLastPersistenceMode()).toBe('in-memory');
    });

    it('extracts X-Persistence-Mode header from problem queries to update mode', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({
            'X-Persistence-Mode': 'mongodb',
          }),
          json: () =>
            Promise.resolve({
              success: true,
              data: [],
              meta: { persistenceMode: 'mongodb' },
            }),
        })
      );

      await api.getProblems();
      expect(getLastPersistenceMode()).toBe('mongodb');
    });
  });
});
