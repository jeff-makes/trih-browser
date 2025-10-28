const ROMAN_MAP: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

export function romanToInt(input: string): number | null {
  if (!input) return null;
  const roman = input.toUpperCase().replace(/[^IVXLCDM]/g, "");
  if (!roman) return null;
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i -= 1) {
    const value = ROMAN_MAP[roman[i]];
    if (!value) return null;
    if (value < prev) {
      total -= value;
    } else {
      total += value;
      prev = value;
    }
  }
  return total > 0 ? total : null;
}
