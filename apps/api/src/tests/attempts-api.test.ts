import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { inMemoryAttemptRepository } from '../repositories/inMemoryAttemptRepository';
import { parkingLotProblem } from '../domain';

describe('Problems & Attempts API Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    inMemoryAttemptRepository.clear();
  });

  describe('GET /api/problems', () => {
    it('returns list of available problems with rubric summaries', async () => {
      const res = await request(app).get('/api/problems');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p: { slug: string }) => p.slug === 'parking-lot')).toBe(true);
    });

    it('returns full problem details for parking-lot', async () => {
      const res = await request(app).get('/api/problems/parking-lot');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('parking-lot');
      expect(res.body.data.starterTemplate).toBeDefined();
      expect(res.body.data.sampleSolution).toBeDefined();
      expect(res.body.data.rubric.criteria).toHaveLength(4);
    });

    it('returns 404 for unknown problem slug', async () => {
      const res = await request(app).get('/api/problems/non-existent-problem');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROBLEM_NOT_FOUND');
    });
  });

  describe('POST /api/attempts and workflow', () => {
    it('creates a new attempt and resumes existing active attempt', async () => {
      // 1. Create new attempt
      const createRes = await request(app).post('/api/attempts').send({
        problemSlug: 'parking-lot',
        anonymousUserId: 'anon_user_1',
      });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.id).toMatch(/^att_/);
      expect(createRes.body.meta.isNew).toBe(true);

      const attemptId = createRes.body.data.id;

      // 2. Resuming the same problem for same user returns existing attempt
      const resumeRes = await request(app).post('/api/attempts').send({
        problemSlug: 'parking-lot',
        anonymousUserId: 'anon_user_1',
      });

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.data.id).toBe(attemptId);
      expect(resumeRes.body.meta.isNew).toBe(false);
    });

    it('returns 400 for invalid attempt creation payload', async () => {
      const res = await request(app).post('/api/attempts').send({
        problemSlug: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when getting non-existent attempt', async () => {
      const res = await request(app).get('/api/attempts/att_invalid');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ATTEMPT_NOT_FOUND');
    });

    it('submits a design, creates revision 1, protects against duplicates, and creates revision 2 with comparison', async () => {
      // 1. Create attempt
      const attemptRes = await request(app).post('/api/attempts').send({
        problemSlug: 'parking-lot',
        anonymousUserId: 'anon_user_learner',
      });
      const attemptId = attemptRes.body.data.id;

      // 2. Submit initial design (Revision 1)
      const sub1Res = await request(app)
        .post(`/api/attempts/${attemptId}/submissions`)
        .send(parkingLotProblem.starterTemplate);

      expect(sub1Res.status).toBe(201);
      expect(sub1Res.headers['x-persistence-mode']).toBe('in-memory');
      expect(sub1Res.body.data.revisionNumber).toBe(1);
      expect(sub1Res.body.data.evaluation).toBeDefined();
      expect(sub1Res.body.data.evaluation.overallScore).toBeGreaterThan(0);
      expect(sub1Res.body.meta.isDuplicate).toBe(false);

      const sub1Id = sub1Res.body.data.id;

      // 3. Duplicate submission within 5 seconds returns 200 with isDuplicate: true
      const dupRes = await request(app)
        .post(`/api/attempts/${attemptId}/submissions`)
        .send(parkingLotProblem.starterTemplate);

      expect(dupRes.status).toBe(200);
      expect(dupRes.body.data.id).toBe(sub1Id);
      expect(dupRes.body.data.revisionNumber).toBe(1);
      expect(dupRes.body.meta.isDuplicate).toBe(true);

      // 4. Submit modified design (Revision 2 using sample solution)
      const sub2Res = await request(app)
        .post(`/api/attempts/${attemptId}/submissions`)
        .send(parkingLotProblem.sampleSolution);

      expect(sub2Res.status).toBe(201);
      expect(sub2Res.body.data.revisionNumber).toBe(2);
      expect(sub2Res.body.data.parentSubmissionId).toBe(sub1Id);
      expect(sub2Res.body.data.evaluation.comparisonWithPrevious).toBeDefined();
      expect(sub2Res.body.meta.isDuplicate).toBe(false);

      // 5. Compare revisions via GET /api/attempts/:id/compare
      const compareRes = await request(app).get(
        `/api/attempts/${attemptId}/compare?revA=1&revB=2`
      );

      expect(compareRes.status).toBe(200);
      expect(compareRes.body.success).toBe(true);
      expect(compareRes.body.data.comparison).toBeDefined();
      expect(compareRes.body.data.comparison.previousRevisionNumber).toBe(1);
      expect(compareRes.body.data.revisionA.revisionNumber).toBe(1);
      expect(compareRes.body.data.revisionB.revisionNumber).toBe(2);

      // 6. Verify attempt details has both submissions
      const detailsRes = await request(app).get(`/api/attempts/${attemptId}`);
      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.data.currentRevisionNumber).toBe(2);
      expect(detailsRes.body.data.submissions).toHaveLength(2);
    });

    it('rejects invalid submission schema with 400 and returns structured details without incrementing revision', async () => {
      const attemptRes = await request(app).post('/api/attempts').send({
        problemSlug: 'parking-lot',
        anonymousUserId: 'anon_test',
      });
      const attemptId = attemptRes.body.data.id;

      const res = await request(app)
        .post(`/api/attempts/${attemptId}/submissions`)
        .send({
          problemSlug: 'parking-lot',
          entities: [], // Invalid: min 2 required
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.length).toBeGreaterThan(0);
      expect(res.body.error.details[0]).toHaveProperty('path');
      expect(res.body.error.details[0]).toHaveProperty('message');

      // Verify that revision was NOT incremented
      const attemptDetails = await request(app).get(`/api/attempts/${attemptId}`);
      expect(attemptDetails.body.data.currentRevisionNumber).toBe(0);
      expect(attemptDetails.body.data.submissions).toHaveLength(0);
    });

    it('rejects Revision #4 payload with actionable entity name error details and accepts when fixed', async () => {
      const attemptRes = await request(app).post('/api/attempts').send({
        problemSlug: 'parking-lot',
        anonymousUserId: 'anon_rev4_tester',
      });
      const attemptId = attemptRes.body.data.id;

      const failingRevision4 = {
        problemSlug: 'parking-lot',
        assumptions: ['Multi-floor parking facility with separate entry and exit gates.'],
        entities: [
          {
            name: 'ParkingLot',
            type: 'class',
            responsibilities: ['Coordinates workflow'],
            attributes: [],
            methods: [],
          },
          {
            name: 'SpotAllocationStrategy (INTERFACE)',
            type: 'class',
            responsibilities: ['Defines spot selection'],
            attributes: [],
            methods: [],
          },
        ],
        relationships: [],
        designPatterns: [],
        edgeCasesConsidered: ['Full lot condition handled gracefully'],
      };

      // 1. Failing attempt
      const failRes = await request(app)
        .post(`/api/attempts/${attemptId}/submissions`)
        .send(failingRevision4);

      expect(failRes.status).toBe(400);
      expect(failRes.body.error.code).toBe('VALIDATION_ERROR');
      const errorPaths = failRes.body.error.details.map((d: { path: string }) => d.path);
      expect(errorPaths).toContain('entities.1.name');
      const entity1Error = failRes.body.error.details.find(
        (d: { path: string }) => d.path === 'entities.1.name'
      );
      expect(entity1Error.message).toContain('no spaces or parentheses');

      // Revision is still 0
      const checkAttempt = await request(app).get(`/api/attempts/${attemptId}`);
      expect(checkAttempt.body.data.currentRevisionNumber).toBe(0);

      // 2. Fixed payload succeeds
      const fixedRevision4 = {
        ...failingRevision4,
        entities: [
          failingRevision4.entities[0],
          {
            ...failingRevision4.entities[1],
            name: 'SpotAllocationStrategy',
            type: 'interface',
          },
        ],
      };

      const successRes = await request(app)
        .post(`/api/attempts/${attemptId}/submissions`)
        .send(fixedRevision4);

      expect(successRes.status).toBe(201);
      expect(successRes.body.success).toBe(true);
      expect(successRes.body.data.revisionNumber).toBe(1);

      // Revision is now 1
      const updatedAttempt = await request(app).get(`/api/attempts/${attemptId}`);
      expect(updatedAttempt.body.data.currentRevisionNumber).toBe(1);
      expect(updatedAttempt.body.data.submissions).toHaveLength(1);
    });
  });
});
