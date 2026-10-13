import type {
  Problem,
  ProblemSummary,
  Attempt,
  Submission,
  StructuredDesign,
  ComparisonSummary,
} from '../types';

export function getOrCreateAnonymousUserId(): string {
  const STORAGE_KEY = 'dk_anonymous_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, userId);
  }
  return userId;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    isNew?: boolean;
    isDuplicate?: boolean;
    persistenceMode?: 'in-memory' | 'mongodb';
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const persistenceHeader = (res.headers.get('x-persistence-mode') || 'in-memory') as
    | 'in-memory'
    | 'mongodb';

  const body = await res.json();
  if (!res.ok) {
    const message = body.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  if (!body.meta) {
    body.meta = {};
  }
  if (!body.meta.persistenceMode) {
    body.meta.persistenceMode = persistenceHeader;
  }

  return body;
}

export const api = {
  async getProblems(): Promise<ProblemSummary[]> {
    const res = await request<ProblemSummary[]>('/api/problems');
    return res.data;
  },

  async getProblem(slug: string): Promise<Problem> {
    const res = await request<Problem>(`/api/problems/${slug}`);
    return res.data;
  },

  async startOrResumeAttempt(
    problemSlug: string,
    anonymousUserId: string
  ): Promise<{ attempt: Attempt; isNew: boolean }> {
    const res = await request<Attempt>('/api/attempts', {
      method: 'POST',
      body: JSON.stringify({ problemSlug, anonymousUserId }),
    });
    return { attempt: res.data, isNew: !!res.meta?.isNew };
  },

  async getAttempt(id: string): Promise<{ attempt: Attempt; persistenceMode: 'in-memory' | 'mongodb' }> {
    const res = await request<Attempt>(`/api/attempts/${id}`);
    return {
      attempt: res.data,
      persistenceMode: res.meta?.persistenceMode || 'in-memory',
    };
  },

  async submitDesign(
    attemptId: string,
    design: StructuredDesign
  ): Promise<{
    submission: Submission;
    isDuplicate: boolean;
    persistenceMode: 'in-memory' | 'mongodb';
  }> {
    const res = await request<Submission>(`/api/attempts/${attemptId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(design),
    });
    return {
      submission: res.data,
      isDuplicate: !!res.meta?.isDuplicate,
      persistenceMode: res.meta?.persistenceMode || 'in-memory',
    };
  },

  async compareRevisions(
    attemptId: string,
    revA: number,
    revB: number
  ): Promise<{
    comparison: ComparisonSummary;
    revisionA: { revisionNumber: number; overallScore?: number; submittedAt: string };
    revisionB: { revisionNumber: number; overallScore?: number; submittedAt: string };
    persistenceMode: 'in-memory' | 'mongodb';
  }> {
    const res = await request<{
      comparison: ComparisonSummary;
      revisionA: { revisionNumber: number; overallScore?: number; submittedAt: string };
      revisionB: { revisionNumber: number; overallScore?: number; submittedAt: string };
    }>(`/api/attempts/${attemptId}/compare?revA=${revA}&revB=${revB}`);

    return {
      comparison: res.data.comparison,
      revisionA: res.data.revisionA,
      revisionB: res.data.revisionB,
      persistenceMode: res.meta?.persistenceMode || 'in-memory',
    };
  },
};
