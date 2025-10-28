import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export type CenturyMap = Map<number, string>;

const CANDIDATE_FILES = [
  ["data", "century-map.csv"],
  ["docs", "century-map.csv"],
  ["data", "century-map.json"],
  ["docs", "century-map.json"],
];

export function centuryLabelToRange(label: string): { from: number; to: number } | null {
  const trimmed = label.trim().toLowerCase();
  const simple = trimmed.match(/^(\d{3,4})s$/);
  if (simple) {
    const start = Number.parseInt(simple[1], 10);
    if (!Number.isNaN(start)) {
      return { from: start, to: start + 99 };
    }
  }

  const centuryMatch = trimmed.match(/^(\d{1,2})(st|nd|rd|th)\s+century\s*(bc|ad)?$/);
  if (centuryMatch) {
    const order = Number.parseInt(centuryMatch[1], 10);
    if (Number.isNaN(order)) return null;
    const era = centuryMatch[3];
    const from = (order - 1) * 100 + 1;
    const to = order * 100;
    if (era === "bc") {
      return { from: -to, to: -(from - 1) };
    }
    return { from, to };
  }

  return null;
}

function loadCsv(filePath: string): CenturyMap {
  const raw = fs.readFileSync(filePath, "utf8");
  const records: Array<Record<string, string>> = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const map: CenturyMap = new Map();
  for (const record of records) {
    const keys = Object.keys(record);
    if (!keys.length) continue;
    const episodeKey = keys.find((key) => key.toLowerCase().includes("episode")) ?? keys[0];
    const labelKey = keys.find((key) => key.toLowerCase().includes("century")) ?? keys[1];
    if (!labelKey) continue;
    const episodeValue = Number.parseInt(record[episodeKey], 10);
    if (Number.isNaN(episodeValue)) continue;
    const labelValue = record[labelKey];
    if (!labelValue) continue;
    map.set(episodeValue, labelValue);
  }
  return map;
}

function loadJson(filePath: string): CenturyMap {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as Record<string, string> | Array<{ episode: number; label: string }>;
  const map: CenturyMap = new Map();
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (!item) continue;
      const episode = Number(item.episode);
      if (Number.isNaN(episode)) continue;
      if (typeof item.label !== "string") continue;
      map.set(episode, item.label);
    }
    return map;
  }
  for (const [key, value] of Object.entries(parsed)) {
    const episode = Number.parseInt(key, 10);
    if (Number.isNaN(episode)) continue;
    if (typeof value !== "string") continue;
    map.set(episode, value);
  }
  return map;
}

export function loadCenturyMap(rootDir: string): CenturyMap {
  for (const segments of CANDIDATE_FILES) {
    const resolved = path.join(rootDir, ...segments);
    if (!fs.existsSync(resolved)) continue;
    try {
      if (resolved.endsWith(".csv")) {
        return loadCsv(resolved);
      }
      if (resolved.endsWith(".json")) {
        return loadJson(resolved);
      }
    } catch (error) {
      console.warn(`Failed to parse century map at ${resolved}:`, error);
    }
  }
  return new Map();
}
