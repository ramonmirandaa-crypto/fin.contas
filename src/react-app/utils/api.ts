const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const sanitizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

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

  return ensureScheme(fallback.replace(/\/+$/, ''));
};

const explicitBaseUrl = ensureScheme(sanitizedBaseUrl);

const resolveBaseUrls = () => {
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
  } catch (_error) {
    return null;
  }
}

async function withClerkAuthorization(init?: RequestInit): Promise<RequestInit> {
  const baseInit: RequestInit = init ? { ...init } : {};

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
    const token = await getToken();

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

type FallbackResolution = {
  attemptedBaseUrl: string;
  hostFallbackBaseUrl: string;
  secondaryBaseUrl: string;
};

function resolveFallbackBaseUrl(
  response: Response,
  attemptedUrl: string,
  method: string,
  { attemptedBaseUrl, hostFallbackBaseUrl, secondaryBaseUrl }: FallbackResolution,
): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const resolvedUrl = resolveAttemptedUrl(attemptedUrl);

  if (!resolvedUrl.startsWith(window.location.origin)) {
    return '';
  }

  if (!secondaryBaseUrl && (!hostFallbackBaseUrl || hostFallbackBaseUrl === attemptedBaseUrl)) {
    return '';
  }

  if (response.status !== 404 && response.status !== 405) {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

    if (!contentType.includes('text/html')) {
      return '';
    }

    if (!resolvedUrl.includes('/api/') && method === 'GET') {
      return '';
    }
  }

  if (secondaryBaseUrl && secondaryBaseUrl !== attemptedBaseUrl) {
    return secondaryBaseUrl;
  }

  if (hostFallbackBaseUrl && hostFallbackBaseUrl !== attemptedBaseUrl) {
    return hostFallbackBaseUrl;
  }

  return '';
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
  const { primaryBaseUrl, secondaryBaseUrl, hostFallbackBaseUrl } = resolveBaseUrls();
  const requestInit = await withClerkAuthorization(init);
  const method = requestInit.method?.toUpperCase?.() ?? 'GET';
  const primaryUrl = buildUrl(path, primaryBaseUrl);
  const primaryResponse = await executeFetch(primaryUrl, primaryBaseUrl, requestInit);

  const fallbackBaseUrl = resolveFallbackBaseUrl(primaryResponse, primaryUrl, method, {
    attemptedBaseUrl: primaryBaseUrl,
    hostFallbackBaseUrl,
    secondaryBaseUrl,
  });

  if (fallbackBaseUrl) {
    if (typeof primaryResponse.body?.cancel === 'function') {
      primaryResponse.body.cancel().catch(() => {});
    }

    const fallbackUrl = buildUrl(path, fallbackBaseUrl);
    return executeFetch(fallbackUrl, fallbackBaseUrl, requestInit);
  }

  return primaryResponse;
}

export function getApiUrl(path: string): string {
  const { primaryBaseUrl, secondaryBaseUrl } = resolveBaseUrls();
  return buildUrl(path, primaryBaseUrl || secondaryBaseUrl);
}
