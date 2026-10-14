import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('GET /api/health', () => {
  const app = createApp();

  it('should return 200 OK with health status metadata and persistence mode', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'designkarlo-api');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('persistenceMode');
    expect(['in-memory', 'mongodb']).toContain(res.body.persistenceMode);
    expect(res.headers['x-persistence-mode']).toBeDefined();
  });

  it('should permit CORS requests from deployed Netlify frontend and expose X-Persistence-Mode', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://designkarlo.netlify.app');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://designkarlo.netlify.app');
    expect(res.headers['access-control-expose-headers']).toContain('X-Persistence-Mode');
  });

  it('should permit CORS requests from local development origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('should reject CORS requests from unapproved origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://malicious-site.example.com');

    // Express error handler catches CORS error
    expect(res.status).toBe(500);
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: 'Cannot GET /api/non-existent-route',
        code: 'ROUTE_NOT_FOUND',
      },
    });
  });
});
