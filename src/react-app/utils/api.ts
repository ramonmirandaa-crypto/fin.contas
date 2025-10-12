const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const stripTrailingSlashes = (value: string): string => {
  let end = value.length;

  while (end > 0 && value.charCodeAt(end - 1) === 47 /* '/' */) {
    end -= 1;
  }

  return value.slice(0, end);
};

const sanitizedBaseUrl = rawBaseUrl ? stripTrailingSlashes(rawBaseUrl) : '';

const PRODUCTION_FALLBACKS: Record<string, string> = {
  'contas.ramonma.online': 'https://n5jcegoubmvau.mocha.app',
  'fincontas.ramonma.online': 'https://n5jcegoubmvau.mocha.app',
};

const ensureScheme = (value: string) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('//') || value.startsWith('/')) {
    return value;
  }

  return `https://${value}`;
};

const getHostFallbackBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const fallback = PRODUCTION_FALLBACKS[window.location.hostname.toLowerCase()];
  if (!fallback) {
    return '';
  }

  return ensureScheme(stripTrailingSlashes(fallback));
};

const normalizePathForOrigin = (value: string): string => {
  if (!value) {
    return '/';
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.pathname || '/';
    } catch {
      return '/';
    }
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return normalizedPath || '/';
};

const isSameOriginBaseUrl = (value: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!value) {
    return true;
  }

  try {
    const candidate = new URL(value, window.location.origin);
    return candidate.origin === window.location.origin;
  } catch {
    return false;
  }
};

const explicitBaseUrl = ensureScheme(sanitizedBaseUrl);

type BaseUrlResolution = {
  primaryBaseUrl: string;
  secondaryBaseUrl: string;
  hostFallbackBaseUrl: string;
};

const resolveBaseUrls = (): BaseUrlResolution => {
  const hostFallbackBaseUrl = getHostFallbackBaseUrl();
  const primaryBaseUrl = explicitBaseUrl || hostFallbackBaseUrl || '';
  const secondaryBaseUrl =
    explicitBaseUrl && hostFallbackBaseUrl && explicitBaseUrl !== hostFallbackBaseUrl
      ? hostFallbackBaseUrl
      : '';

  return {
    primaryBaseUrl,
    secondaryBaseUrl,
    hostFallbackBaseUrl,
  };
};

const isMutatingMethod = (method: string) => {
  const normalized = method.toUpperCase();
  return normalized !== 'GET' && normalized !== 'HEAD';
};

const buildBaseUrlAttempts = (method: string, path: string, baseUrls: BaseUrlResolution) => {
  const attempts: string[] = [];
  const pushBaseUrl = (candidate?: string | null) => {
    if (!candidate) {
      return;
    }

    if (attempts.includes(candidate)) {
      return;
    }

    attempts.push(candidate);
  };

  const normalizedPath = normalizePathForOrigin(path);
  const preferHostFallback =
    Boolean(baseUrls.hostFallbackBaseUrl) &&
    isSameOriginBaseUrl(baseUrls.primaryBaseUrl) &&
    (isMutatingMethod(method) || normalizedPath.startsWith('/api/'));

  const { primaryBaseUrl, secondaryBaseUrl, hostFallbackBaseUrl } = baseUrls;

  if (preferHostFallback) {
    pushBaseUrl(hostFallbackBaseUrl);
    pushBaseUrl(primaryBaseUrl);
    pushBaseUrl(secondaryBaseUrl);
  } else {
    pushBaseUrl(primaryBaseUrl);
    pushBaseUrl(secondaryBaseUrl);
    pushBaseUrl(hostFallbackBaseUrl);
  }

  if (!attempts.length) {
    attempts.push('');
  }

  return attempts;
};

type ClerkSessionLike = {
  getToken: (options?: Record<string, unknown>) => Promise<string | null>;
};

type ClerkGlobalLike = {
  session?: ClerkSessionLike | null;
};

function getAuthorizationHeader(headers?: HeadersInit | null): string | null {
  if (!headers) {
    return null;
  }

  try {
    return new Headers(headers).get('authorization');
  } catch {
    return null;
  }
}

const TOKEN_REFRESH_BUFFER_MS = 30_000;
const DEFAULT_TOKEN_TTL_MS = 2 * 60_000;

type TokenCacheEntry = {
  token: string;
  expiresAt: number;
};

let cachedClerkToken: TokenCacheEntry | null = null;
let inflightTokenPromise: Promise<string | null> | null = null;

const getGlobalAtob = () => {
  if (typeof globalThis !== 'undefined') {
    const globalAtob = (globalThis as { atob?: typeof atob }).atob;
    if (typeof globalAtob === 'function') {
      return globalAtob.bind(globalThis);
    }

    const globalBuffer = (globalThis as {
      Buffer?: {
        from: (input: string, encoding: string) => { toString: (encoding: string) => string };
      };
    }).Buffer;

    if (globalBuffer) {
      return (value: string) => globalBuffer.from(value, 'base64').toString('binary');
    }
  }

  if (typeof atob === 'function') {
    return atob;
  }

  return null;
};

const decodeBase64Url = (segment: string): string | null => {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized.padEnd(normalized.length + paddingLength, '=');
    const decoder = getGlobalAtob();

    if (!decoder) {
      return null;
    }

    return decoder(padded);
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  const payloadSegment = segments[1];
  const decoded = decodeBase64Url(payloadSegment);

  if (!decoded) {
    return null;
  }

  try {
    const jsonString = decodeURIComponent(
      decoded
        .split('')
        .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(jsonString) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const extractTokenExpiry = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  if (typeof exp === 'number' && Number.isFinite(exp)) {
    return exp * 1000;
  }

  return null;
};

const getCachedClerkToken = (): string | null => {
  if (!cachedClerkToken) {
    return null;
  }

  if (Date.now() >= cachedClerkToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
    cachedClerkToken = null;
    return null;
  }

  return cachedClerkToken.token;
};

const rememberClerkToken = (token: string | null) => {
  if (!token) {
    cachedClerkToken = null;
    return;
  }

  const expiresAt = extractTokenExpiry(token) ?? Date.now() + DEFAULT_TOKEN_TTL_MS;
  cachedClerkToken = { token, expiresAt };
};

const invalidateCachedClerkToken = () => {
  cachedClerkToken = null;
  inflightTokenPromise = null;
};

const cloneHeaders = (headers?: HeadersInit): Headers | undefined => {
  if (!headers) {
    return undefined;
  }

  return new Headers(headers);
};

const cloneRequestInit = (init?: RequestInit): RequestInit => {
  if (!init) {
    return {};
  }

  const cloned: RequestInit = { ...init };
  cloned.headers = cloneHeaders(init.headers);
  return cloned;
};

type GetTokenFn = ClerkSessionLike['getToken'];

const requestClerkToken = async (getToken: GetTokenFn): Promise<string | null> => {
  const cachedToken = getCachedClerkToken();
  if (cachedToken) {
    return cachedToken;
  }

  if (!inflightTokenPromise) {
    inflightTokenPromise = getToken().then(token => {
      rememberClerkToken(token);
      inflightTokenPromise = null;
      return token;
    }).catch(error => {
      inflightTokenPromise = null;
      throw error;
    });
  }

  return inflightTokenPromise;
};

async function withClerkAuthorization(init?: RequestInit): Promise<RequestInit> {
  const baseInit = cloneRequestInit(init);

  if (typeof window === 'undefined') {
    return baseInit;
  }

  if (getAuthorizationHeader(baseInit.headers)) {
    return baseInit;
  }

  const clerk = (window as unknown as { Clerk?: ClerkGlobalLike }).Clerk;
  const session = clerk?.session;
  const getToken = session?.getToken?.bind(session);

  if (!getToken) {
    return baseInit;
  }

  try {
    const token = await requestClerkToken(getToken);

    if (!token) {
      return baseInit;
    }

    const headers = new Headers(baseInit.headers ?? {});
    headers.set('Authorization', `Bearer ${token}`);
    baseInit.headers = headers;
  } catch (error) {
    console.warn('Falha ao obter token de sessão do Clerk:', error);
  }

  return baseInit;
}

export class OfflineError extends Error {
  readonly code = 'ERR_OFFLINE';

  constructor(message = 'Sem conexão com a internet. Verifique sua rede e tente novamente.') {
    super(message);
    this.name = 'OfflineError';
  }
}

function buildUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  const isAbsolute = /^https?:\/\//i.test(baseUrl) || baseUrl.startsWith('//');
  const isRelative = baseUrl.startsWith('/');

  if (isAbsolute || isRelative) {
    return `${baseUrl}${normalizedPath}`;
  }

  return normalizedPath;
}

function isNavigatorOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function prepareOptions(baseUrl: string, init?: RequestInit): RequestInit {
  const options: RequestInit = {
    ...init,
  };

  const isAbsolute = /^https?:\/\//i.test(baseUrl) || baseUrl.startsWith('//');

  if (isAbsolute && !init?.credentials) {
    options.credentials = 'include';
  }

  return options;
}

function resolveAttemptedUrl(attemptedUrl: string): string {
  if (typeof window === 'undefined') {
    return attemptedUrl;
  }

  if (/^https?:\/\//i.test(attemptedUrl)) {
    return attemptedUrl;
  }

  if (attemptedUrl.startsWith('//')) {
    return `${window.location.protocol}${attemptedUrl}`;
  }

  const normalizedPath = attemptedUrl.startsWith('/') ? attemptedUrl : `/${attemptedUrl}`;
  return `${window.location.origin}${normalizedPath}`;
}

function shouldRetryWithNextBase(
  response: Response,
  attemptedUrl: string,
  method: string,
  attemptedBaseUrl: string,
  nextBaseUrl: string | undefined,
  baseUrls: BaseUrlResolution,
) {
  if (!nextBaseUrl || nextBaseUrl === attemptedBaseUrl) {
    return false;
  }

  if (!isSameOriginBaseUrl(attemptedBaseUrl)) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const resolvedUrl = resolveAttemptedUrl(attemptedUrl);

  if (!resolvedUrl.startsWith(window.location.origin)) {
    return false;
  }

  const { hostFallbackBaseUrl, secondaryBaseUrl } = baseUrls;

  if (!secondaryBaseUrl && (!hostFallbackBaseUrl || hostFallbackBaseUrl === attemptedBaseUrl)) {
    return false;
  }

  if (response.status === 404 || response.status === 405) {
    return true;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (!contentType.includes('text/html')) {
    return false;
  }

  if (!resolvedUrl.includes('/api/') && method === 'GET') {
    return false;
  }

  const normalizedPath = normalizePathForOrigin(attemptedUrl);

  if (normalizedPath.startsWith('/api/')) {
    return true;
  }

  return isMutatingMethod(method);
}

async function executeFetch(url: string, baseUrl: string, init?: RequestInit) {
  if (isNavigatorOffline()) {
    throw new OfflineError();
  }

  const options = prepareOptions(baseUrl, init);

  try {
    return await fetch(url, options);
  } catch (error) {
    if (isNavigatorOffline()) {
      throw new OfflineError();
    }

    throw error;
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const baseUrls = resolveBaseUrls();
  const baseInit = cloneRequestInit(init);
  let lastError: unknown = null;

  for (let authAttempt = 0; authAttempt < 2; authAttempt += 1) {
    const requestInit = await withClerkAuthorization(baseInit);
    const method = requestInit.method?.toUpperCase?.() ?? 'GET';
    const attempts = buildBaseUrlAttempts(method, path, baseUrls);
    const hasAuthorizationHeader = Boolean(getAuthorizationHeader(requestInit.headers));
    let retryWithFreshToken = false;

    for (let index = 0; index < attempts.length; index += 1) {
      const baseUrl = attempts[index];
      const url = buildUrl(path, baseUrl);

      try {
        const response = await executeFetch(url, baseUrl, requestInit);

        if (response.status === 401) {
          if (hasAuthorizationHeader && authAttempt === 0) {
            const responseBody = response.body;

            if (responseBody && typeof responseBody.cancel === 'function') {
              try {
                await responseBody.cancel();
              } catch {
                // Ignore cancellation errors and retry with a fresh token.
              }
            }

            invalidateCachedClerkToken();
            retryWithFreshToken = true;
            lastError = null;
            break;
          }

          return response;
        }

        const nextBaseUrl = attempts[index + 1];

        if (shouldRetryWithNextBase(response, url, method, baseUrl, nextBaseUrl, baseUrls)) {
          const responseBody = response.body;

          if (responseBody && typeof responseBody.cancel === 'function') {
            try {
              await responseBody.cancel();
            } catch {
              // Ignore cancellation errors to keep retrying the request.
            }
          }

          continue;
        }

        return response;
      } catch (error) {
        lastError = error;
      }
    }

    if (!retryWithFreshToken) {
      break;
    }
  }

  throw lastError ?? new Error('Request failed');
}

export function getApiUrl(path: string): string {
  const baseUrls = resolveBaseUrls();
  const [firstBaseUrl] = buildBaseUrlAttempts('GET', path, baseUrls);
  return buildUrl(path, firstBaseUrl);
}
