const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Converts a string into a deterministic slug as described in PRD §22.
 */
export const toSlug = (input: string): string => {
  if (!input) {
    return "";
  }

  const normalized = input.normalize("NFKD").replace(DIACRITICS, "");
  const lower = normalized.toLowerCase();
  const hyphenated = lower.replace(NON_ALPHANUMERIC, "-");
  const trimmed = hyphenated.replace(/^-+|-+$/g, "");
  return trimmed;
};

export default toSlug;
