import type {
  Problem,
  ProblemSummary,
  Attempt,
  Submission,
  StructuredDesign,
  ComparisonSummary,
  ValidationErrorDetail,
} from '../types';

export class ApiError extends Error {
  code?: string;
  details?: ValidationErrorDetail[];

  constructor(message: string, code?: string, details?: ValidationErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

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

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  uptime: number;
  environment: string;
  database: string;
  persistenceMode?: 'in-memory' | 'mongodb';
}

/**
 * Resolves the API base URL based on environment variables and runtime environment.
 * - If VITE_API_URL is defined, strips any trailing slash.
 * - In production (PROD mode, e.g. on Netlify), defaults to 'https://designkarlo-api.onrender.com'.
 * - In development (DEV mode), defaults to '' so requests leverage Vite's dev server proxy (/api -> :5000).
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env?.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (import.meta.env?.PROD) {
    return 'https://designkarlo-api.onrender.com';
  }
  return '';
}

/**
 * Builds a fully qualified API endpoint URL ensuring:
 * 1. Fully-qualified URLs (http:// or https://) are preserved as-is.
 * 2. Leading slashes are normalized.
 * 3. The '/api' prefix is included exactly once without duplication.
 */
export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = getApiBaseUrl();
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedPath.startsWith('/api')) {
    normalizedPath = `/api${normalizedPath}`;
  }

  if (!base) {
    return normalizedPath;
  }

  const cleanBase = base.replace(/\/api\/?$/, '');
  return `${cleanBase}${normalizedPath}`;
}

let currentPersistenceMode: 'in-memory' | 'mongodb' = 'in-memory';

export function getLastPersistenceMode(): 'in-memory' | 'mongodb' {
  return currentPersistenceMode;
}

export function setLastPersistenceMode(mode: 'in-memory' | 'mongodb') {
  currentPersistenceMode = mode;
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const fullUrl = buildApiUrl(path);
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const rawHeader =
    res.headers?.get('x-persistence-mode') ||
    res.headers?.get('X-Persistence-Mode');
  const persistenceHeader =
    rawHeader === 'mongodb' || rawHeader === 'in-memory' ? rawHeader : null;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.error?.message || `Request failed with status ${res.status}`;
    throw new ApiError(message, body.error?.code, body.error?.details);
  }

  if (!body.meta) {
    body.meta = {};
  }
  if (persistenceHeader && !body.meta.persistenceMode) {
    body.meta.persistenceMode = persistenceHeader;
  }
  if (body.meta.persistenceMode) {
    currentPersistenceMode = body.meta.persistenceMode;
  }

  // Handle direct payload responses (such as /api/health which returns fields at root)
  if (body.data === undefined && (body.status === 'ok' || body.service)) {
    body.data = body;
  }

  return body;
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await request<HealthResponse>('/api/health');
    const health = (res.data || res) as HealthResponse;
    if (health.persistenceMode) {
      currentPersistenceMode = health.persistenceMode;
    } else if (health.database === 'connected') {
      currentPersistenceMode = 'mongodb';
    }
    return health;
  },

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
    const pMode = res.meta?.persistenceMode || currentPersistenceMode;
    return {
      attempt: res.data,
      persistenceMode: pMode,
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
    const pMode = res.meta?.persistenceMode || currentPersistenceMode;
    return {
      submission: res.data,
      isDuplicate: !!res.meta?.isDuplicate,
      persistenceMode: pMode,
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

    const pMode = res.meta?.persistenceMode || currentPersistenceMode;
    return {
      comparison: res.data.comparison,
      revisionA: res.data.revisionA,
      revisionB: res.data.revisionB,
      persistenceMode: pMode,
    };
  },
};
