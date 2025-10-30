import crypto from "node:crypto";
import { RawEpisode, ProgrammaticEpisode } from "@/types";

const CLEANUP_VERSION = 1;

const sha256 = (input: string): string =>
  crypto.createHash("sha256").update(input, "utf8").digest("hex");

const normaliseText = (input: string): string => {
  if (!input) {
    return "";
  }

  return input.replace(/\r\n/g, "\n").trim();
};

const cleanTitle = (title: string): string => title.replace(/\s+/g, " ").trim();

const convertHtmlToMarkdown = (html: string): string => {
  if (!html) {
    return "";
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
};

const splitDescriptionBlocks = (text: string): string[] => {
  return text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
};

const removeBoilerplateBlocks = (blocks: string[]): string[] => {
  const patterns = [
    "Learn more about your ad choices",
    "podcastchoices.com/adchoices",
    "therestishistory.com",
    "Join The Rest Is History Club",
    "The Rest Is History Club",
    "@TheRestHistory",
    "instagram.com/theresthistory",
    "facebook.com/theresthistory",
    "tiktok.com/@theresthistory",
    "Get our book",
    "Buy tickets",
    "Sign up to our newsletter"
  ];

  return blocks.filter(
    (block) => !patterns.some((pattern) => block.toLowerCase().includes(pattern.toLowerCase()))
  );
};

const normaliseCreditLine = (line: string): string =>
  line
    .replace(/[–—−﹕꞉：]/g, ":")
    .replace(/\s+/g, " ")
    .trim();

const extractCredits = (blocks: string[]): Record<string, string[]> => {
  const creditMap = new Map<string, string[]>();

  const prefixMap: Record<string, string> = {
    "producer": "producer",
    "producers": "producer",
    "senior producer": "seniorProducer",
    "senior producers": "seniorProducer",
    "exec producer": "execProducer",
    "executive producer": "execProducer",
    "exec producers": "execProducer",
    "executive producers": "execProducer",
    "researcher": "researcher",
    "researchers": "researcher",
    "assistant producer": "assistantProducer",
    "assistant producers": "assistantProducer",
    "editor": "editor",
    "editors": "editor",
    "sound design": "soundDesign",
    "sound designer": "soundDesign",
    "sound designers": "soundDesign"
  };

  blocks.forEach((block) => {
    const lines = block.split(/\n+/);
    lines.forEach((line) => {
      const candidate = normaliseCreditLine(line);
      const [rawLabel, ...rest] = candidate.split(":");
      if (!rawLabel || rest.length === 0) {
        return;
      }

      const labelKey = rawLabel.toLowerCase();
      const standardKey = prefixMap[labelKey];
      if (!standardKey) {
        return;
      }

      const value = rest.join(":").trim();
      if (!value) {
        return;
      }

      const existing = creditMap.get(standardKey) ?? [];
      const names = value
        .split(/,|&/)
        .map((name) => name.trim())
        .filter(Boolean);

      creditMap.set(standardKey, [...existing, ...names]);
    });
  });

  return Object.fromEntries(creditMap.entries());
};

const fingerprintEpisode = (title: string, markdown: string): string => {
  const payload = `epfp:v1\ncleanup_v=${CLEANUP_VERSION}\n${title}\n${markdown}`;
  return sha256(payload);
};

export const runProgrammaticEnrichment = (
  rawEpisodes: RawEpisode[]
): Record<string, ProgrammaticEpisode> => {
  const result: Record<string, ProgrammaticEpisode> = {};

  rawEpisodes.forEach((episode) => {
    const cleanEpisodeTitle = cleanTitle(episode.title);
    const markdown = convertHtmlToMarkdown(episode.description);
    const cleanDescriptionMarkdown = markdown;
    const cleanDescriptionText = normaliseText(markdown);
    const descriptionBlocks = removeBoilerplateBlocks(splitDescriptionBlocks(cleanDescriptionText));
    const credits = extractCredits(descriptionBlocks);
    const fingerprint = fingerprintEpisode(cleanEpisodeTitle, cleanDescriptionMarkdown);

    result[episode.episodeId] = {
      episodeId: episode.episodeId,
      title: episode.title,
      publishedAt: episode.publishedAt,
      description: episode.description,
      audioUrl: episode.audioUrl,
      cleanTitle: cleanEpisodeTitle,
      cleanDescriptionMarkdown,
      cleanDescriptionText,
      descriptionBlocks,
      credits: Object.keys(credits).length > 0 ? credits : undefined,
      fingerprint,
      cleanupVersion: CLEANUP_VERSION,
      derived: undefined,
      part: null,
      seriesId: null,
      seriesKey: null,
      seriesKeyRaw: null,
      seriesGroupingConfidence: "low",
      rssLastSeenAt: episode.rssLastSeenAt,
      itunesEpisode: episode.source.itunesEpisode ?? null
    };
  });

  return result;
};

export default runProgrammaticEnrichment;
