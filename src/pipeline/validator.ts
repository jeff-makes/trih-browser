import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import {
  LlmEpisodeCacheEntry,
  LlmSeriesCacheEntry,
  ProgrammaticEpisode,
  ProgrammaticSeries,
  PublicEpisode,
  PublicSeries,
  RawEpisode
} from "@/types";

interface ValidatorInput {
  rawEpisodes: RawEpisode[];
  programmaticEpisodes: Record<string, ProgrammaticEpisode>;
  programmaticSeries: Record<string, ProgrammaticSeries>;
  episodeLlmCache: Record<string, LlmEpisodeCacheEntry>;
  seriesLlmCache: Record<string, LlmSeriesCacheEntry>;
  publicEpisodes: PublicEpisode[];
  publicSeries: PublicSeries[];
  episodeSchema: Record<string, unknown>;
  seriesSchema: Record<string, unknown>;
  episodeCacheSchema: Record<string, unknown>;
  seriesCacheSchema: Record<string, unknown>;
}

const createAjv = () => {
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    allowUnionTypes: true
  });
  addFormats(ajv);
  return ajv;
};

const formatAjvErrors = (errors: ErrorObject[] | null | undefined): string => {
  if (!errors || errors.length === 0) {
    return "";
  }

  return errors
    .map((error) => {
      const params = typeof error.params === "object" ? JSON.stringify(error.params) : String(error.params);
      return `${error.instancePath || "(root)"} ${error.message ?? ""} ${params}`;
    })
    .join("\n");
};

const ensureUniqueIds = (values: string[], context: string) => {
  const seen = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) {
      throw new Error(`Duplicate identifier detected in ${context}: ${value}`);
    }
    seen.add(value);
  });
};

const ensureYearOrder = (from: number | null, to: number | null, context: string) => {
  if (from !== null && to !== null && from > to) {
    throw new Error(`Invalid year range in ${context}: yearFrom (${from}) > yearTo (${to})`);
  }
};

export const runValidation = ({
  rawEpisodes,
  programmaticEpisodes,
  programmaticSeries,
  episodeLlmCache,
  seriesLlmCache,
  publicEpisodes,
  publicSeries,
  episodeSchema,
  seriesSchema,
  episodeCacheSchema,
  seriesCacheSchema
}: ValidatorInput): void => {
  const ajv = createAjv();

  const validateEpisode = ajv.compile(episodeSchema);
  const validateSeries = ajv.compile(seriesSchema);
  const validateEpisodeCache = ajv.compile(episodeCacheSchema);
  const validateSeriesCache = ajv.compile(seriesCacheSchema);

  const allEpisodeIds = rawEpisodes.map((episode) => episode.episodeId);
  ensureUniqueIds(allEpisodeIds, "raw episodes");

  const publicEpisodeIds = publicEpisodes.map((episode) => episode.episodeId);
  ensureUniqueIds(publicEpisodeIds, "public episodes");

  const rawEpisodeMap = new Map(rawEpisodes.map((episode) => [episode.episodeId, episode]));
  const programmaticEpisodeMap = new Map(
    Object.values(programmaticEpisodes).map((episode) => [episode.episodeId, episode])
  );

  const publicSeriesMap = new Map(publicSeries.map((series) => [series.seriesId, series]));

  publicEpisodes.forEach((episode) => {
    if (!rawEpisodeMap.has(episode.episodeId)) {
      throw new Error(`Public episode ${episode.episodeId} missing corresponding raw episode`);
    }
    if (!programmaticEpisodeMap.has(episode.episodeId)) {
      throw new Error(`Public episode ${episode.episodeId} missing corresponding programmatic episode`);
    }

    if (episode.seriesId) {
      const parentSeries = publicSeriesMap.get(episode.seriesId);
      if (!parentSeries) {
        throw new Error(`Public episode ${episode.episodeId} references missing series ${episode.seriesId}`);
      }
      if (!parentSeries.episodeIds.includes(episode.episodeId)) {
        throw new Error(
          `Series ${episode.seriesId} does not include episode ${episode.episodeId} in its membership`
        );
      }
    }

    ensureYearOrder(episode.yearFrom, episode.yearTo, `public episode ${episode.episodeId}`);

    if (!validateEpisode(episode)) {
      throw new Error(
        `Public episode ${episode.episodeId} failed schema validation:\n${formatAjvErrors(validateEpisode.errors)}`
      );
    }
  });

  publicSeries.forEach((series) => {
    if (!validateSeries(series)) {
      throw new Error(
        `Public series ${series.seriesId} failed schema validation:\n${formatAjvErrors(validateSeries.errors)}`
      );
    }

    series.episodeIds.forEach((episodeId) => {
      if (!publicEpisodeIds.includes(episodeId)) {
        throw new Error(`Series ${series.seriesId} references missing public episode ${episodeId}`);
      }
    });

    ensureYearOrder(series.yearFrom, series.yearTo, `public series ${series.seriesId}`);
  });

  Object.entries(episodeLlmCache).forEach(([cacheKey, entry]) => {
    if (!validateEpisodeCache(entry)) {
      throw new Error(`Episode LLM cache entry ${cacheKey} failed schema validation:\n${formatAjvErrors(validateEpisodeCache.errors)}`);
    }
  });

  Object.entries(seriesLlmCache).forEach(([cacheKey, entry]) => {
    if (!validateSeriesCache(entry)) {
      throw new Error(`Series LLM cache entry ${cacheKey} failed schema validation:\n${formatAjvErrors(validateSeriesCache.errors)}`);
    }
  });
};

export default runValidation;
