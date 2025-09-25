const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const sanitizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';

const looksLikeHost = (value: string) => {
  const trimmed = value.replace(/^\/+/, '');
  return /[a-z0-9-]+\.[a-z0-9.-]+/i.test(trimmed);
};

const withHttpsScheme = (value: string) => {
  const withoutLeadingSlashes = value.replace(/^\/+/, '');
  return `https://${withoutLeadingSlashes}`;
};

const resolveAbsoluteBase = (value: string) => {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (looksLikeHost(value)) {
    return withHttpsScheme(value);
  }

  return '';
};

const absoluteBaseUrl = resolveAbsoluteBase(sanitizedBaseUrl);
const normalizedBaseUrl = absoluteBaseUrl || sanitizedBaseUrl;
const isAbsoluteBaseUrl = Boolean(absoluteBaseUrl);
const isRelativeBaseUrl = !isAbsoluteBaseUrl && normalizedBaseUrl.startsWith('/');

const hostLikeRelativeBase = !absoluteBaseUrl && looksLikeHost(sanitizedBaseUrl)
  ? withHttpsScheme(sanitizedBaseUrl)
  : '';
const effectiveAbsoluteBaseUrl = absoluteBaseUrl || hostLikeRelativeBase;
const shouldAttachCredentials = Boolean(effectiveAbsoluteBaseUrl);

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!normalizedBaseUrl && !effectiveAbsoluteBaseUrl) {
    return normalizedPath;
  }

  if (effectiveAbsoluteBaseUrl) {
    const baseWithTrailingSlash = effectiveAbsoluteBaseUrl.endsWith('/')
      ? effectiveAbsoluteBaseUrl
      : `${effectiveAbsoluteBaseUrl}/`;
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

  if (shouldAttachCredentials && !init?.credentials) {
    options.credentials = 'include';
  }

  return fetch(url, options);
}

export function getApiUrl(path: string): string {
  return buildUrl(path);
}
