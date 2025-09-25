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
