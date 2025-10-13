import { createClerkClient } from '@clerk/backend';
import type { Context } from 'hono';
import { errorResponse } from './response';
import type { AuthRequestState, AuthVariables, Env, WorkerMiddleware } from '../types';

const clerkClientCache = new Map<string, ReturnType<typeof createClerkClient>>();

export const getClerkClient = (env: Env) => {
  const secretKey = env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing CLERK_SECRET_KEY environment variable');
  }

  const cachedClient = clerkClientCache.get(secretKey);
  if (cachedClient) {
    return cachedClient;
  }

  const client = createClerkClient({ secretKey });
  clerkClientCache.set(secretKey, client);
  return client;
};

export const getUserId = (
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
): string | null => {
  try {
    const userId = c.get?.('userId') as string | undefined;
    if (userId) {
      return userId;
    }

    const authState = c.get?.('auth') as AuthRequestState | undefined;
    const auth = authState?.toAuth();
    if (auth?.userId) {
      return auth.userId;
    }
  } catch (error) {
    console.warn('Failed to resolve user from context:', error);
  }

  const legacyUserId = c.req.header('X-User-ID') || c.req.header('x-user-id');
  return legacyUserId || null;
};

export const authMiddleware: WorkerMiddleware = async (c, next) => {
  try {
    const clerkClient = getClerkClient(c.env);
    const requestState = await clerkClient.authenticateRequest(c.req.raw);
    const auth = requestState.toAuth();
    const userId = auth?.userId;

    if (!requestState.isSignedIn || !userId) {
      return errorResponse('Unauthorized', 401);
    }

    c.set('auth', requestState);
    c.set('userId', userId);

    await next();
  } catch (error) {
    console.error('Clerk authentication error:', error);
    return errorResponse('Unauthorized', 401);
  }
};
