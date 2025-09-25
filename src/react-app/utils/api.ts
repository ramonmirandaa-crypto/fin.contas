const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const normalizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';
const isAbsoluteBaseUrl = normalizedBaseUrl.startsWith('http://') || normalizedBaseUrl.startsWith('https://');

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  const url = buildUrl(path);
  const options: RequestInit = {
    ...init,
  };

  if (isAbsoluteBaseUrl && !init?.credentials) {
    options.credentials = 'include';
  }

  return fetch(url, options);
}

export function getApiUrl(path: string): string {
  return buildUrl(path);
}
