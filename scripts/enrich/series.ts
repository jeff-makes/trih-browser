import type { Episode } from "./types";
import { cleanTitleStem, parseDate, daysBetween, slugify } from "./utils";
import { romanToInt } from "./roman";

export interface SeriesAssignment {
  key: string;
  title: string;
  part: number;
  source: "rules";
}

export interface SeriesGroup {
  key: string;
  title: string;
  episodes: Episode[];
  parts: number[];
}

const PART_REGEX = /(.*?)(?:\s*[-–—:]\s*)?(?:part|pt\.?)\s*(?:#|no\.?\s*)?([ivxlcdm]+|\d+)/i;

interface TitleCandidate {
  key: string;
  title: string;
  part: number;
}

function extractSeriesCandidate(title: string | null): TitleCandidate | null {
  if (!title) return null;
  const match = title.match(PART_REGEX);
  if (!match) return null;
  const rawStem = cleanTitleStem(match[1] ?? "");
  if (!rawStem) return null;
  const rawPart = match[2];
  if (!rawPart) return null;
  const numeric = /\d+/.test(rawPart) ? Number.parseInt(rawPart, 10) : romanToInt(rawPart);
  if (!numeric || Number.isNaN(numeric) || numeric <= 0) return null;
  const key = slugify(rawStem);
  if (!key) return null;
  return {
    key,
    title: rawStem,
    part: numeric,
  };
}

function pickCandidate(episode: Episode): TitleCandidate | null {
  const fromSheet = extractSeriesCandidate(episode.title_sheet ?? null);
  if (fromSheet) return fromSheet;
  return extractSeriesCandidate(episode.title_feed ?? null);
}

function sortEntries(entries: Array<{ episode: Episode; part: number; title: string }>) {
  return [...entries].sort((a, b) => a.episode.episode - b.episode.episode);
}

function isValidSeries(entries: Array<{ episode: Episode; part: number; title: string }>): boolean {
  if (entries.length < 2) return false;
  const sorted = sortEntries(entries);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.part !== prev.part + 1) {
      return false;
    }
    const episodeGap = curr.episode.episode - prev.episode.episode;
    if (episodeGap > 2) {
      return false;
    }
    const prevDate = parseDate(prev.episode.pubDate);
    const currDate = parseDate(curr.episode.pubDate);
    const diff = daysBetween(prevDate, currDate);
    if (diff !== null && diff > 21) {
      return false;
    }
  }
  return true;
}

export interface SeriesDetectionResult {
  assignmentsBySlug: Map<string, SeriesAssignment>;
  groupsByKey: Map<string, SeriesGroup>;
}

export function detectSeries(episodes: Episode[]): SeriesDetectionResult {
  const grouped = new Map<string, Array<{ episode: Episode; part: number; title: string }>>();

  for (const episode of episodes) {
    const candidate = pickCandidate(episode);
    if (!candidate) continue;
    const bucket = grouped.get(candidate.key) ?? [];
    bucket.push({ episode, part: candidate.part, title: candidate.title });
    grouped.set(candidate.key, bucket);
  }

  const assignmentsBySlug = new Map<string, SeriesAssignment>();
  const groupsByKey = new Map<string, SeriesGroup>();

  for (const [key, entries] of grouped.entries()) {
    if (!isValidSeries(entries)) {
      continue;
    }
    const sorted = sortEntries(entries);
    const title = sorted[0]?.title ?? key;
    const parts = sorted.map((item) => item.part);
    const episodesList = sorted.map((item) => item.episode);
    const group: SeriesGroup = {
      key,
      title,
      episodes: episodesList,
      parts,
    };
    groupsByKey.set(key, group);
    for (let i = 0; i < sorted.length; i += 1) {
      const entry = sorted[i];
      assignmentsBySlug.set(entry.episode.slug, {
        key,
        title,
        part: entry.part,
        source: "rules",
      });
    }
  }

  return { assignmentsBySlug, groupsByKey };
}
