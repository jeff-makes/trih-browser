import { promises as fs } from "node:fs";
import path from "node:path";

import stableStringify from "@/lib/stableStringify";
import { runFetchStep } from "@/pipeline/fetcher";
import { runProgrammaticEnrichment } from "@/pipeline/enricher";
import { runSeriesGrouping } from "@/pipeline/grouper";
import { runComposeStep } from "@/pipeline/composer";
import { runValidation } from "@/pipeline/validator";
import { runLlmEpisodeEnrichment, runLlmSeriesEnrichment } from "@/pipeline/llmEnricher";
import {
  DailyRssSnapshot,
  LlmEpisodeCacheEntry,
  LlmSeriesCacheEntry,
  RawEpisode
} from "@/types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const readJsonFile = async <T>(filePath: string, fallback: T): Promise<T> => {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
};

const writeJsonFile = async (filePath: string, data: unknown): Promise<void> => {
  const serialised = stableStringify(data as any);
  await fs.writeFile(filePath, serialised + "\n", "utf8");
};

const ensureDir = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

const appendJsonLines = async (filePath: string, entries: unknown[]): Promise<void> => {
  if (entries.length === 0) {
    return;
  }

  const content = entries.map((entry) => stableStringify(entry as any)).join("\n") + "\n";
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, content, "utf8");
};

interface LocalPipelineOptions {
  maxEpisodeLlmCalls?: number;
  maxSeriesLlmCalls?: number;
  dryRun?: boolean;
  since?: string | null;
  plan?: boolean;
  outputDir?: string | null;
  forceEpisodeIds?: Set<string>;
  forceSeriesIds?: Set<string>;
}

export const runLocalPipeline = async (options: LocalPipelineOptions = {}): Promise<void> => {
  const dataDir = options.outputDir
    ? path.resolve(process.cwd(), options.outputDir, "data")
    : DATA_DIR;
  const publicDir = options.outputDir
    ? path.resolve(process.cwd(), options.outputDir, "public")
    : PUBLIC_DIR;

  await ensureDir(dataDir);
  await ensureDir(publicDir);

  const rawEpisodesPath = path.join(dataDir, "episodes-raw.json");
  const programmaticEpisodesPath = path.join(dataDir, "episodes-programmatic.json");
  const seriesProgrammaticPath = path.join(dataDir, "series-programmatic.json");
  const episodeLlmCachePath = path.join(dataDir, "episodes-llm.json");
  const seriesLlmCachePath = path.join(dataDir, "series-llm.json");
  const rssSnapshotPath = path.join(dataDir, "source", `rss.${new Date().toISOString().slice(0, 10)}.json`);
  const publicEpisodesPath = path.join(publicDir, "episodes.json");
  const publicSeriesPath = path.join(publicDir, "series.json");
  const episodeSchemaPath = path.join(process.cwd(), "schema", "episode.public.schema.json");
  const seriesSchemaPath = path.join(process.cwd(), "schema", "series.public.schema.json");
  const cacheSchemaPath = path.join(process.cwd(), "schema", "cache.llm.schema.json");

  const existingRawEpisodes = await readJsonFile<RawEpisode[]>(rawEpisodesPath, []);
  const existingEpisodeLlmCache = await readJsonFile<Record<string, LlmEpisodeCacheEntry>>(episodeLlmCachePath, {});
  const existingSeriesLlmCache = await readJsonFile<Record<string, LlmSeriesCacheEntry>>(seriesLlmCachePath, {});

  const { newRawEpisodes, dailySnapshot } = await runFetchStep(existingRawEpisodes, {
    since: options.since ?? null,
    dryRun: options.dryRun ?? false,
    plan: options.plan ?? false
  });

  const updatedRawEpisodes = [...existingRawEpisodes, ...newRawEpisodes];
  const programmaticEpisodes = runProgrammaticEnrichment(updatedRawEpisodes);
  const { programmaticSeries } = runSeriesGrouping(programmaticEpisodes);

  const forceEpisodeIds = options.forceEpisodeIds
    ? new Set(Array.from(options.forceEpisodeIds).filter((id) => programmaticEpisodes[id]))
    : undefined;
  const forceSeriesIds = options.forceSeriesIds
    ? new Set(Array.from(options.forceSeriesIds).filter((id) => programmaticSeries[id]))
    : undefined;

  const episodeLlmResult = await runLlmEpisodeEnrichment(programmaticEpisodes, existingEpisodeLlmCache, {
    maxLlmCalls: options.maxEpisodeLlmCalls,
    forceIds: forceEpisodeIds,
    planOnly: options.plan
  });
  const seriesLlmResult = await runLlmSeriesEnrichment(programmaticSeries, existingSeriesLlmCache, {
    maxLlmCalls: options.maxSeriesLlmCalls,
    forceIds: forceSeriesIds,
    planOnly: options.plan
  });

  const updatedEpisodeLlmCache = episodeLlmResult.cache;
  const updatedSeriesLlmCache = seriesLlmResult.cache;

  const errors = [...episodeLlmResult.errors, ...seriesLlmResult.errors];

  if (options.plan) {
    if (episodeLlmResult.planned.length === 0 && seriesLlmResult.planned.length === 0) {
      console.log("No LLM enrichments required — caches are up to date.");
    } else {
      if (episodeLlmResult.planned.length > 0) {
        const episodeRows = episodeLlmResult.planned.map((item) => {
          const episode = programmaticEpisodes[item.episodeId];
          const approxTokens = Math.ceil(
            (episode.cleanDescriptionText.length + episode.cleanTitle.length) / 3.5
          );
          return {
            episodeId: item.episodeId,
            fingerprint: item.fingerprint,
            approxTokens
          };
        });
        console.log("Episodes requiring LLM enrichment:");
        console.table(episodeRows);
      }
      if (seriesLlmResult.planned.length > 0) {
        const seriesRows = seriesLlmResult.planned.map((item) => {
          const series = programmaticSeries[item.seriesId];
          const summaryCount = series.derived?.episodeSummaries?.length ?? 0;
          const approxTokens = Math.ceil(summaryCount * 400);
          return {
            seriesId: item.seriesId,
            fingerprint: item.fingerprint,
            approxTokens
          };
        });
        console.log("Series requiring LLM enrichment:");
        console.table(seriesRows);
      }
    }
    return;
  }

  const { publicEpisodes, publicSeries } = runComposeStep({
    rawEpisodes: updatedRawEpisodes,
    programmaticEpisodes,
    programmaticSeries,
    episodeLlmCache: updatedEpisodeLlmCache,
    seriesLlmCache: updatedSeriesLlmCache
  });

  const [episodeSchema, seriesSchema, cacheSchema] = await Promise.all([
    readJsonFile<Record<string, unknown>>(episodeSchemaPath, {}),
    readJsonFile<Record<string, unknown>>(seriesSchemaPath, {}),
    readJsonFile<Record<string, unknown>>(cacheSchemaPath, {})
  ]);

  runValidation({
    rawEpisodes: updatedRawEpisodes,
    programmaticEpisodes,
    programmaticSeries,
    episodeLlmCache: updatedEpisodeLlmCache,
    seriesLlmCache: updatedSeriesLlmCache,
    publicEpisodes,
    publicSeries,
    episodeSchema,
    seriesSchema,
    episodeCacheSchema: cacheSchema,
    seriesCacheSchema: cacheSchema
  });

  if (!options.dryRun) {
    await ensureDir(path.dirname(rssSnapshotPath));
    await writeJsonFile(rssSnapshotPath, dailySnapshot as DailyRssSnapshot);
    await writeJsonFile(rawEpisodesPath, updatedRawEpisodes);
    await writeJsonFile(programmaticEpisodesPath, programmaticEpisodes);
    await writeJsonFile(seriesProgrammaticPath, programmaticSeries);
    await writeJsonFile(episodeLlmCachePath, updatedEpisodeLlmCache);
    await writeJsonFile(seriesLlmCachePath, updatedSeriesLlmCache);
    await writeJsonFile(publicEpisodesPath, publicEpisodes);
    await writeJsonFile(publicSeriesPath, publicSeries);
  } else {
    console.log("Dry run enabled — skipping filesystem writes.");
  }

  if (errors.length > 0) {
    if (options.dryRun) {
      console.log("Encountered recoverable errors:");
      errors.forEach((entry) => {
        console.log(`${entry.stage} :: ${entry.itemId} — ${entry.message}`);
      });
    } else {
      const errorsPath = path.join(dataDir, "errors.jsonl");
      await appendJsonLines(errorsPath, errors);
    }
  }
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const options: LocalPipelineOptions = {};
  const forcedIds: string[] = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--dry":
        options.dryRun = true;
        break;
      case "--plan":
        options.plan = true;
        break;
      case "--since":
        options.since = args[i + 1] ?? null;
        i += 1;
        break;
      case "--output":
        options.outputDir = args[i + 1] ?? null;
        i += 1;
        break;
      case "--max-llm-calls":
        {
          const value = Number(args[i + 1]);
          if (!Number.isNaN(value)) {
            options.maxEpisodeLlmCalls = value;
            options.maxSeriesLlmCalls = value;
          }
          i += 1;
        }
        break;
      case "--force-llm":
        {
          const value = args[i + 1];
          if (value) {
            value.split(",").forEach((id) => {
              const trimmed = id.trim();
              if (trimmed) {
                forcedIds.push(trimmed);
              }
            });
          }
          i += 1;
        }
        break;
      default:
        break;
    }
  }

  if (forcedIds.length > 0) {
    options.forceEpisodeIds = new Set(forcedIds);
    options.forceSeriesIds = new Set(forcedIds);
  }

  runLocalPipeline(options).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
