import { toKebabCase } from "./utils";

const CONTROLLED_LABELS = [
  "Nelson",
  "Napoleonic Era",
  "WWII",
  "WWI",
  "American Revolution",
  "Reformation",
  "Byzantium",
  "Rome",
  "Cleopatra",
  "Charlemagne/Franks",
  "Hundred Years' War",
  "Luther",
  "Titanic",
  "Elections UK",
  "Churchill",
  "Reagan",
  "Columbus",
  "Vikings",
  "Middle Ages",
  "Ancient Egypt",
  "Cold War",
  "French Revolution",
  "Great Northern War",
];

const CONTROLLED_SET = new Set(CONTROLLED_LABELS.map((label) => toKebabCase(label)));

export function normalizeUmbrella(label: string): string {
  return toKebabCase(label);
}

export function sanitizeUmbrellas(input: string[]): string[] {
  const extras: string[] = [];
  const result: string[] = [];
  for (const label of input) {
    if (!label) continue;
    const normalized = normalizeUmbrella(label);
    if (!normalized) continue;
    if (CONTROLLED_SET.has(normalized)) {
      if (!result.includes(normalized)) {
        result.push(normalized);
      }
      continue;
    }
    if (extras.includes(normalized)) {
      continue;
    }
    if (extras.length < 2) {
      extras.push(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function getControlledUmbrellas(): string[] {
  return Array.from(CONTROLLED_SET);
}
