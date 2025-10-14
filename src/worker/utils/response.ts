import type { Env } from '../types';
import { resolveAllowedOrigin } from './origin';

export const errorResponse = (message: string, status = 400) => {
  return Response.json({ error: message }, { status });
};

export const preflightResponse = (
  origin: string | null | undefined,
  allowMethods: string[],
  env: Env,
  requestUrl: string,
) => {
  const headers = new Headers({
    'Access-Control-Allow-Methods': allowMethods.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });

  const allowedOrigin = resolveAllowedOrigin(origin, env, requestUrl);

  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }

  return new Response(null, { status: 204, headers });
};
