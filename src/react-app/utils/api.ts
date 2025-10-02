const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const sanitizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

const ensureScheme = (value: string) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('//') || value.startsWith('/')) {
    return value;
  }

  return `https://${value}`;
};

const normalizedBaseUrl = ensureScheme(sanitizedBaseUrl);
const isAbsoluteBaseUrl = /^https?:\/\//i.test(normalizedBaseUrl) || normalizedBaseUrl.startsWith('//');
const isRelativeBaseUrl = normalizedBaseUrl.startsWith('/');

export class OfflineError extends Error {
  readonly code = 'ERR_OFFLINE';

  constructor(message = 'Sem conexão com a internet. Verifique sua rede e tente novamente.') {
    super(message);
    this.name = 'OfflineError';
  }
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  if (isAbsoluteBaseUrl || isRelativeBaseUrl) {
    return `${normalizedBaseUrl}${normalizedPath}`;
  }

  return normalizedPath;
}

function isNavigatorOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function apiFetch(path: string, init?: RequestInit) {
  const url = buildUrl(path);
  const options: RequestInit = {
    ...init,
  };

  if (isAbsoluteBaseUrl && !init?.credentials) {
    options.credentials = 'include';
  }

  if (isNavigatorOffline()) {
    return Promise.reject(new OfflineError());
  }

  return fetch(url, options).catch(error => {
    if (isNavigatorOffline()) {
      throw new OfflineError();
    }

    throw error;
  });
}

export function getApiUrl(path: string): string {
  return buildUrl(path);
}
