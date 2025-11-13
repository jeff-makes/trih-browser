const DEFAULT_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "http://localhost:3000";

const normaliseBase = (base: string): string => {
  try {
    return new URL(base).toString();
  } catch {
    return "http://localhost:3000";
  }
};

const SITE_URL = normaliseBase(DEFAULT_SITE_URL);

const normalisePath = (path: string): string =>
  path.startsWith("/") ? path : `/${path}`;

export const buildCanonicalUrl = (path: string): string => {
  try {
    return new URL(normalisePath(path), SITE_URL).toString();
  } catch {
    return `http://localhost:3000${normalisePath(path)}`;
  }
};

export const getSiteUrl = (): string => SITE_URL;

export default buildCanonicalUrl;
