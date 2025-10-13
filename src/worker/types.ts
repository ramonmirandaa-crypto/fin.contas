import type { ClerkClient } from '@clerk/backend';
import type { MiddlewareHandler } from 'hono';

export interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  CLERK_SECRET_KEY: string;
  PLUGGY_CLIENT_ID: string;
  PLUGGY_CLIENT_SECRET: string;
}

export type AuthRequestState = Awaited<ReturnType<ClerkClient['authenticateRequest']>>;

export type AuthVariables = {
  auth: AuthRequestState;
  userId: string;
};

export type WorkerMiddleware = MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }>;

export type D1RunResult = {
  success: boolean;
  error?: string;
  meta?: {
    changes?: number;
    last_row_id?: number;
  };
};
