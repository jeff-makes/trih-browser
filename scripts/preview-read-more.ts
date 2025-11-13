import { linkifyParagraph, segmentDescription } from "../src/lib/description";
import { getAllEpisodes } from "../src/lib/data";

const DEFAULT_SAMPLE_COUNT = 10;

const args = process.argv.slice(2);
let sampleCount = DEFAULT_SAMPLE_COUNT;
let useRandom = false;
let slugFilter: string | null = null;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--count" && args[index + 1]) {
    sampleCount = Number(args[index + 1]) || DEFAULT_SAMPLE_COUNT;
    index += 1;
  } else if (arg === "--random") {
    useRandom = true;
  } else if (arg === "--slug" && args[index + 1]) {
    slugFilter = args[index + 1];
    index += 1;
  }
}

const pickSampleIndices = (length: number, count: number): number[] => {
  if (length === 0) {
    return [];
  }
  const step = Math.max(1, Math.floor(length / count));
  const indices: number[] = [];
  for (let idx = 0; idx < length && indices.length < count; idx += step) {
    indices.push(idx);
  }
  if (indices[indices.length - 1] !== length - 1) {
    indices[indices.length - 1] = length - 1;
  }
  return indices;
};

const pickRandomIndices = (length: number, count: number): number[] => {
  const desired = Math.min(count, length);
  const picks = new Set<number>();
  while (picks.size < desired) {
    picks.add(Math.floor(Math.random() * length));
  }
  return Array.from(picks).sort((a, b) => a - b);
};

const selectIndices = (length: number): number[] => {
  if (slugFilter) {
    return [];
  }
  if (useRandom) {
    return pickRandomIndices(length, sampleCount);
  }
  return pickSampleIndices(length, sampleCount);
};

const formatParagraph = (paragraph: string) =>
  linkifyParagraph(paragraph)
    .map((segment) => (segment.href ? `[${segment.text}](${segment.href})` : segment.text))
    .join("");

const episodes = getAllEpisodes();
let sampleIndices: number[];

if (slugFilter) {
  const index = episodes.findIndex((episode) => episode.slug === slugFilter);
  if (index === -1) {
    console.error(`No episode found for slug "${slugFilter}"`);
    process.exit(1);
  }
  sampleIndices = [index];
} else {
  sampleIndices = selectIndices(episodes.length);
}

for (const index of sampleIndices) {
  const episode = episodes[index];
  const { intro, promo } = segmentDescription(episode.cleanDescriptionMarkdown);
  const hasPromo = promo.length > 0;

  console.log("=".repeat(80));
  console.log(`${episode.cleanTitle} (${episode.publishedAt.slice(0, 10)})`);
  console.log(`Slug: ${episode.slug}`);
  console.log(`Intro paragraphs: ${intro.length}${hasPromo ? ` • Hidden paragraphs: ${promo.length}` : ""}`);
  console.log("");

  console.log("Intro:");
  intro.forEach((paragraph, idx) => {
    console.log(`  ${idx + 1}. ${formatParagraph(paragraph)}`);
  });

  if (hasPromo) {
    console.log("");
    console.log("Read more:");
    promo.forEach((paragraph, idx) => {
      console.log(`  ${idx + 1}. ${formatParagraph(paragraph)}`);
    });
  } else {
    console.log("");
    console.log("(No promo blocks detected)");
  }

  console.log("");
}
