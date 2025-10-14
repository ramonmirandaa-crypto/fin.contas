import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';
import type { AuthVariables, Env } from '../types';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://0199711a-c4e4-7884-86f1-522b7cf5b5f9.n5jcegoubmvau.workers.dev',
  'https://fincontas.ramonma.online',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const ALLOWED_HOSTNAME_SUFFIXES = ['.workers.dev', '.pages.dev'];

const stripTrailingSlashes = (value: string): string => {
  let end = value.length;

  while (end > 0 && value.charCodeAt(end - 1) === 47 /* '/' */) {
    end -= 1;
  }

  return value.slice(0, end);
};

const normalizeOrigin = (value: string): string | null => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

const extractHostname = (value: string): string | null => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const extractOriginFromUrl = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const parseAdditionalOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((candidate) => stripTrailingSlashes(candidate.trim()))
    .filter(Boolean);
};

const buildAllowedOriginSet = (env: Env): Set<string> => {
  const allowed = new Set<string>();

  const register = (candidate: string) => {
    const normalized = normalizeOrigin(candidate) ?? stripTrailingSlashes(candidate);
    if (normalized) {
      allowed.add(normalized);
    }
  };

  for (const origin of DEFAULT_ALLOWED_ORIGINS) {
    register(origin);
  }

  for (const origin of parseAdditionalOrigins(env.ALLOWED_ORIGINS)) {
    register(origin);
  }

  return allowed;
};

const shouldAllowOrigin = (
  origin: string,
  allowedOrigins: Set<string>,
  requestOrigin: string | null,
): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);

  if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  const hostname = extractHostname(origin);

  if (hostname && LOCAL_HOSTNAMES.has(hostname)) {
    return true;
  }

  if (hostname && ALLOWED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return true;
  }

  if (requestOrigin) {
    const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
    if (normalizedOrigin && normalizedRequestOrigin && normalizedOrigin === normalizedRequestOrigin) {
      return true;
    }
  }

  return false;
};

export const resolveAllowedOrigin = (
  origin: string | null | undefined,
  env: Env,
  requestUrl: string,
): string | null => {
  if (!origin) {
    return null;
  }

  const allowedOrigins = buildAllowedOriginSet(env);
  const requestOrigin = extractOriginFromUrl(requestUrl);

  return shouldAllowOrigin(origin, allowedOrigins, requestOrigin) ? origin : null;
};

export const createCorsMiddleware = (env: Env): MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> => {
  const allowedOrigins = buildAllowedOriginSet(env);

  return cors({
    origin: (origin, c) => {
      const requestOrigin = extractOriginFromUrl(c.req.url);
      if (!origin) {
        return null;
      }

      return shouldAllowOrigin(origin, allowedOrigins, requestOrigin) ? origin : null;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
};
