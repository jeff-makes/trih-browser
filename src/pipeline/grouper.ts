import { ProgrammaticEpisode, ProgrammaticSeries } from "@/types";
import toSlug from "@/lib/slug";

const MAX_GAP_DAYS = 14;

const getPublishedAt = (episode: ProgrammaticEpisode): Date =>
  new Date(episode.rssLastSeenAt ?? episode.cleanDescriptionMarkdown);

const parsePartIndicator = (title: string): number | null => {
  const partRegex = /\b(?:part|pt\.?|episode)\s*(\d+|[ivxlcdm]+)/i;
  const match = title.match(partRegex);
  if (!match) {
    return null;
  }

  const value = match[1];
  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const romanNumeralMap: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10
  };
  return romanNumeralMap[value.toLowerCase()] ?? null;
};

const normaliseSeriesKey = (title: string): string | null => {
  const base = title.replace(/\(.*?\)/g, "").trim();
  return base || null;
};

export const runSeriesGrouping = (
  programmaticEpisodes: Record<string, ProgrammaticEpisode>
): {
  rawSeries: Record<string, { seriesId: string; episodeIds: string[] }>;
  programmaticSeries: Record<string, ProgrammaticSeries>;
} => {
  const episodes = Object.values(programmaticEpisodes).sort((a, b) =>
    a.cleanTitle.localeCompare(b.cleanTitle)
  );

  const rawSeries: Record<string, { seriesId: string; episodeIds: string[] }> = {};
  const programmaticSeries: Record<string, ProgrammaticSeries> = {};

  episodes.forEach((episode) => {
    const part = parsePartIndicator(episode.cleanTitle);
    const seriesKeyRaw = normaliseSeriesKey(episode.cleanTitle);
    const seriesKey = seriesKeyRaw ? seriesKeyRaw.toLowerCase() : null;

    let seriesId: string | null = null;

    if (seriesKey && part === 1) {
      const slug = toSlug(seriesKey);
      seriesId = `${slug}-${episode.episodeId.slice(0, 8)}`;
    }

    episode.seriesKeyRaw = seriesKeyRaw;
    episode.seriesKey = seriesKey;
    episode.part = part;
    episode.seriesId = seriesId;

    if (!seriesId) {
      return;
    }

    if (!rawSeries[seriesId]) {
      rawSeries[seriesId] = {
        seriesId,
        episodeIds: []
      };
    }

    rawSeries[seriesId].episodeIds.push(episode.episodeId);

    const summary = {
      part,
      cleanTitle: episode.cleanTitle,
      cleanDescriptionText: episode.cleanDescriptionText
    };

    const derivedSeries = programmaticSeries[seriesId];
    if (!derivedSeries) {
      programmaticSeries[seriesId] = {
        seriesId,
        seriesKey,
        seriesKeyRaw,
        seriesTitleFallback: seriesKeyRaw ?? seriesId,
        seriesGroupingConfidence: "low",
        episodeIds: [episode.episodeId],
        memberEpisodeFingerprints: [episode.fingerprint],
        fingerprint: episode.fingerprint,
        yearFrom: episode.yearFrom ?? null,
        yearTo: episode.yearTo ?? null,
        yearConfidence: episode.yearConfidence ?? "unknown",
        derived: {
          episodeSummaries: [summary],
          episodeCount: 1
        },
        rssLastSeenAt: episode.rssLastSeenAt ?? null
      };
    } else {
      derivedSeries.episodeIds.push(episode.episodeId);
      derivedSeries.memberEpisodeFingerprints = [
        ...(derivedSeries.memberEpisodeFingerprints ?? []),
        episode.fingerprint
      ];
      const derived = derivedSeries.derived ?? {};
      const summaries = derived.episodeSummaries ?? [];
      summaries.push(summary);
      derived.episodeSummaries = summaries;
      derived.episodeCount = (derived.episodeCount ?? 0) + 1;
      derivedSeries.derived = derived;
    }
  });

  return { rawSeries, programmaticSeries };
};

export default runSeriesGrouping;
