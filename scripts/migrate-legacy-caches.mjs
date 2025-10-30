#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const stableStringify = (value) => {
  const sortValue = (input) => {
    if (Array.isArray(input)) {
      return input.map((item) => sortValue(item));
    }
    if (input && typeof input === "object") {
      return Object.keys(input)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortValue(input[key]);
          return acc;
        }, {});
    }
    return input;
  };

  return JSON.stringify(sortValue(value));
};

const LEGACY_EPISODES_INPUT = "data/episodes-llm.legacy.json";
const LEGACY_SERIES_INPUT = "data/series-llm.legacy.json";
const OUTPUT_EPISODES = "data/episodes-llm.json";
const OUTPUT_SERIES = "data/series-llm.json";

const readJson = async (filePath, fallback) => {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
};

const writeJson = async (filePath, data) => {
  await writeFile(path.resolve(filePath), stableStringify(data) + "\n", "utf8");
};

const convertEpisodeEntries = (legacyEntries) => {
  const result = {};

  Object.entries(legacyEntries).forEach(([episodeId, entry]) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const fingerprint = entry.fingerprint || "";
    const cacheKey = `${episodeId}:${fingerprint}`;

    result[cacheKey] = {
      episodeId,
      fingerprint,
      model: entry.model || "unknown",
      promptVersion: "legacy-import",
      createdAt: entry.createdAt || new Date().toISOString(),
      status: entry.status || "ok",
      notes: entry.notes || null,
      keyPeople: entry.keyPeople || [],
      keyPlaces: entry.keyPlaces || [],
      keyThemes: entry.keyThemes || [],
      yearFrom: entry.yearFrom ?? null,
      yearTo: entry.yearTo ?? null,
      yearConfidence: entry.yearConfidence || "unknown"
    };
  });

  return result;
};

const convertSeriesEntries = (legacyEntries) => {
  const result = {};

  Object.entries(legacyEntries).forEach(([seriesId, entry]) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const fingerprint = entry.fingerprint || "";
    const cacheKey = `${seriesId}:${fingerprint}`;

    result[cacheKey] = {
      seriesId,
      fingerprint,
      model: entry.model || "unknown",
      promptVersion: "legacy-import",
      createdAt: entry.createdAt || new Date().toISOString(),
      status: entry.status || "ok",
      notes: entry.notes || null,
      seriesTitle: entry.seriesTitle || null,
      narrativeSummary: entry.narrativeSummary || null,
      tonalDescriptors: entry.tonalDescriptors || null,
      yearFrom: entry.yearFrom ?? null,
      yearTo: entry.yearTo ?? null,
      yearConfidence: entry.yearConfidence || "unknown"
    };
  });

  return result;
};

const main = async () => {
  const legacyEpisodeCache = await readJson(LEGACY_EPISODES_INPUT, {});
  const legacySeriesCache = await readJson(LEGACY_SERIES_INPUT, {});

  const newEpisodeCache = convertEpisodeEntries(legacyEpisodeCache);
  const newSeriesCache = convertSeriesEntries(legacySeriesCache);

  await writeJson(OUTPUT_EPISODES, newEpisodeCache);
  await writeJson(OUTPUT_SERIES, newSeriesCache);

  console.log(`Migrated ${Object.keys(newEpisodeCache).length} episode cache entries`);
  console.log(`Migrated ${Object.keys(newSeriesCache).length} series cache entries`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
