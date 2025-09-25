const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const sanitizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

const looksLikeHost = (value: string) => {
  const trimmed = value.replace(/^\/+/, '');
  return /[a-z0-9-]+\.[a-z0-9.-]+/i.test(trimmed);
};

const ensureScheme = (value: string) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('//')) {
    return value;
  }

  if (looksLikeHost(value)) {
    const withoutLeadingSlashes = value.replace(/^\/+/, '');
    return `https://${withoutLeadingSlashes}`;
  }

  return value;
};

const normalizedBaseUrl = ensureScheme(sanitizedBaseUrl);
const isAbsoluteBaseUrl = /^https?:\/\//i.test(normalizedBaseUrl) || normalizedBaseUrl.startsWith('//');
const isRelativeBaseUrl = !isAbsoluteBaseUrl && normalizedBaseUrl.startsWith('/');

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  if (isAbsoluteBaseUrl) {
    const baseWithTrailingSlash = normalizedBaseUrl.endsWith('/')
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/`;
    const relativePath = normalizedPath.replace(/^\/+/, '');
    return `${baseWithTrailingSlash}${relativePath}`;
  }

  if (isRelativeBaseUrl) {
    const baseWithoutTrailingSlash = normalizedBaseUrl.replace(/\/+$/, '');
    if (normalizedPath.startsWith(`${baseWithoutTrailingSlash}/`)) {
      return normalizedPath;
    }
    return `${baseWithoutTrailingSlash}${normalizedPath}`;
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
