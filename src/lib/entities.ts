import { findPerson, findPersonById, PEOPLE_DEFINITIONS } from "@/config/people";
import { findPlace, findPlaceById, PLACE_DEFINITIONS } from "@/config/places";
import { findTopic, findTopicBySlug, TOPIC_DEFINITIONS } from "@/config/topics";
import type { EpisodePersonRef, EpisodePlaceRef, PublicEpisode, PublicSeries } from "@/types";
import { getAllEpisodes, getAllSeries } from "@/lib/data";
import { getPersonSlug, getPlaceSlug, getTopicSlug } from "@/lib/entityLinks";

export interface EntityEpisodeEntry {
  episode: PublicEpisode;
  series: PublicSeries | null;
}

export interface EntityPageData {
  slug: string;
  label: string;
  typeLabel?: string;
  description?: string;
  notes?: string;
  isPending: boolean;
  episodes: EntityEpisodeEntry[];
  firstEpisode?: EntityEpisodeEntry;
  latestEpisode?: EntityEpisodeEntry;
  yearRangeLabel?: string;
  filterParam: "person" | "place" | "topic";
  filterValue: string;
  timelineHref: string;
  metaDescription: string;
}

const PAGE_DESCRIPTION_TEMPLATE = (label: string) =>
  `Explore The Rest Is History episodes about ${label} — from early mentions to the latest deep dives.`;

const humaniseSlug = (value: string): string =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatTypeLabel = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  return humaniseSlug(value.toLowerCase());
};

const formatYear = (year: number): string => (year < 0 ? `${Math.abs(year)} BC` : `${year}`);

const getSeriesLookup = (): Map<string, PublicSeries> =>
  new Map(getAllSeries().map((series) => [series.seriesId, series]));

const toEpisodeEntries = (episodes: PublicEpisode[]): EntityEpisodeEntry[] => {
  const seriesLookup = getSeriesLookup();
  return episodes.map((episode) => ({
    episode,
    series: episode.seriesId ? seriesLookup.get(episode.seriesId) ?? null : null
  }));
};

const sortEntriesChronologically = (entries: EntityEpisodeEntry[]): EntityEpisodeEntry[] =>
  entries.sort((a, b) => {
    const aTime = new Date(a.episode.publishedAt).getTime();
    const bTime = new Date(b.episode.publishedAt).getTime();
    return aTime - bTime;
  });

const deriveLabelFromPeople = (entries: EntityEpisodeEntry[], slug: string): string | undefined => {
  for (const entry of entries) {
    const fromPeople = (entry.episode.people ?? []).find(
      (person) => getPersonSlug(person.name, person.id).toLowerCase() === slug
    );
    if (fromPeople) {
      return fromPeople.name;
    }
    const fromKeys = (entry.episode.keyPeople ?? []).find((name) => getPersonSlug(name).toLowerCase() === slug);
    if (fromKeys) {
      return fromKeys;
    }
  }
  return undefined;
};

const deriveLabelFromPlaces = (entries: EntityEpisodeEntry[], slug: string): string | undefined => {
  for (const entry of entries) {
    const fromPlaces = (entry.episode.places ?? []).find(
      (place) => getPlaceSlug(place.name, place.id).toLowerCase() === slug
    );
    if (fromPlaces) {
      return fromPlaces.name;
    }
    const fromKeys = (entry.episode.keyPlaces ?? []).find((name) => getPlaceSlug(name).toLowerCase() === slug);
    if (fromKeys) {
      return fromKeys;
    }
  }
  return undefined;
};

const deriveLabelFromTopics = (entries: EntityEpisodeEntry[], slug: string): string | undefined => {
  const target = slug.toLowerCase();
  for (const entry of entries) {
    const topic = (entry.episode.keyTopics ?? []).find(
      (candidate) =>
        candidate.slug?.toLowerCase() === target ||
        (candidate.id ? candidate.id.toLowerCase() === target : false)
    );
    if (topic?.label) {
      return topic.label;
    }
  }
  return undefined;
};

const matchesPerson = (episode: PublicEpisode, slug: string): boolean => {
  const lowerSlug = slug.toLowerCase();
  const personMatches =
    (episode.people ?? []).some(
      (person: EpisodePersonRef) => getPersonSlug(person.name, person.id).toLowerCase() === lowerSlug
    ) ||
    (episode.keyPeople ?? []).some((name) => getPersonSlug(name).toLowerCase() === lowerSlug);
  return personMatches;
};

const matchesPlace = (episode: PublicEpisode, slug: string): boolean => {
  const lowerSlug = slug.toLowerCase();
  const placeMatches =
    (episode.places ?? []).some(
      (place: EpisodePlaceRef) => getPlaceSlug(place.name, place.id).toLowerCase() === lowerSlug
    ) ||
    (episode.keyPlaces ?? []).some((name) => getPlaceSlug(name).toLowerCase() === lowerSlug);
  return placeMatches;
};

const matchesTopic = (episode: PublicEpisode, slug: string): boolean => {
  const target = slug.toLowerCase();
  return (episode.keyTopics ?? []).some(
    (topic) =>
      topic.slug?.toLowerCase() === target ||
      (topic.id ? topic.id.toLowerCase() === target : false)
  );
};

const calculateYearRangeLabel = (entries: EntityEpisodeEntry[]): string | undefined => {
  const years: number[] = [];
  entries.forEach(({ episode }) => {
    if (typeof episode.yearFrom === "number") {
      years.push(episode.yearFrom);
    }
    if (typeof episode.yearTo === "number") {
      years.push(episode.yearTo);
    }
    if (typeof episode.yearFrom !== "number" && typeof episode.yearTo !== "number" && episode.publishedAt) {
      const year = new Date(episode.publishedAt).getUTCFullYear();
      if (!Number.isNaN(year)) {
        years.push(year);
      }
    }
  });

  if (years.length === 0) {
    return undefined;
  }

  const min = Math.min(...years);
  const max = Math.max(...years);
  if (min === max) {
    return formatYear(min);
  }
  return `${formatYear(min)} – ${formatYear(max)}`;
};

const buildMetaDescription = (label: string): string => PAGE_DESCRIPTION_TEMPLATE(label);

const createEntityData = (
  entries: EntityEpisodeEntry[],
  options: {
    label: string;
    description?: string;
    notes?: string;
    typeLabel?: string;
    slug: string;
    filterParam: "person" | "place" | "topic";
    isPending: boolean;
  }
): EntityPageData => {
  const sortedEntries = sortEntriesChronologically(entries);
  const firstEpisode = sortedEntries[0];
  const latestEpisode = sortedEntries[sortedEntries.length - 1];

  const filterValue = options.slug;
  const timelineHref = `/timeline?${options.filterParam}=${encodeURIComponent(filterValue)}`;

  return {
    slug: options.slug,
    label: options.label,
    typeLabel: options.typeLabel,
    description: options.description,
    notes: options.notes,
    isPending: options.isPending,
    episodes: sortedEntries,
    firstEpisode,
    latestEpisode,
    yearRangeLabel: calculateYearRangeLabel(sortedEntries),
    filterParam: options.filterParam,
    filterValue,
    timelineHref,
    metaDescription: buildMetaDescription(options.label)
  };
};

export const getPersonEntityData = (rawSlug: string): EntityPageData | null => {
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const definition = findPersonById(slug) ?? findPerson(slug);
  const resolvedSlug = (definition?.id ?? slug).toLowerCase();

  const episodes = toEpisodeEntries(getAllEpisodes().filter((episode) => matchesPerson(episode, resolvedSlug)));
  if (!definition && episodes.length === 0) {
    return null;
  }

  const label =
    definition?.preferredName ?? deriveLabelFromPeople(episodes, resolvedSlug) ?? humaniseSlug(resolvedSlug);

  return createEntityData(episodes, {
    label,
    description: definition?.description ?? undefined,
    notes: definition?.notes ?? undefined,
    slug: resolvedSlug,
    filterParam: "person",
    isPending: !definition
  });
};

export const getPlaceEntityData = (rawSlug: string): EntityPageData | null => {
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const definition = findPlaceById(slug) ?? findPlace(slug);
  const resolvedSlug = (definition?.id ?? slug).toLowerCase();

  const episodes = toEpisodeEntries(getAllEpisodes().filter((episode) => matchesPlace(episode, resolvedSlug)));
  if (!definition && episodes.length === 0) {
    return null;
  }

  const label =
    definition?.preferredName ?? deriveLabelFromPlaces(episodes, resolvedSlug) ?? humaniseSlug(resolvedSlug);

  return createEntityData(episodes, {
    label,
    description: definition?.description ?? undefined,
    notes: definition?.notes ?? undefined,
    typeLabel: formatTypeLabel(definition?.type),
    slug: resolvedSlug,
    filterParam: "place",
    isPending: !definition
  });
};

export const getTopicEntityData = (rawSlug: string): EntityPageData | null => {
  const slug = decodeURIComponent(rawSlug).toLowerCase();
  const definition = findTopicBySlug(slug) ?? findTopic(slug);
  const resolvedSlug = (definition ? definition.slug : slug).toLowerCase();

  const episodes = toEpisodeEntries(getAllEpisodes().filter((episode) => matchesTopic(episode, resolvedSlug)));
  if (!definition && episodes.length === 0) {
    return null;
  }

  const label = definition?.label ?? deriveLabelFromTopics(episodes, resolvedSlug) ?? humaniseSlug(resolvedSlug);

  return createEntityData(episodes, {
    label,
    description: definition?.description ?? undefined,
    notes: definition?.notes ?? undefined,
    typeLabel: formatTypeLabel(definition?.type),
    slug: resolvedSlug,
    filterParam: "topic",
    isPending: !definition
  });
};

export const formatDisplayDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const collectSlugsFromPeople = (): Set<string> => {
  const slugs = new Set<string>();
  PEOPLE_DEFINITIONS.forEach((person) => slugs.add(person.id.toLowerCase()));
  getAllEpisodes().forEach((episode) => {
    (episode.people ?? []).forEach((person) => slugs.add(getPersonSlug(person.name, person.id).toLowerCase()));
    (episode.keyPeople ?? []).forEach((name) => slugs.add(getPersonSlug(name).toLowerCase()));
  });
  return slugs;
};

const collectSlugsFromPlaces = (): Set<string> => {
  const slugs = new Set<string>();
  PLACE_DEFINITIONS.forEach((place) => slugs.add(place.id.toLowerCase()));
  getAllEpisodes().forEach((episode) => {
    (episode.places ?? []).forEach((place) => slugs.add(getPlaceSlug(place.name, place.id).toLowerCase()));
    (episode.keyPlaces ?? []).forEach((name) => slugs.add(getPlaceSlug(name).toLowerCase()));
  });
  return slugs;
};

const collectSlugsFromTopics = (): Set<string> => {
  const slugs = new Set<string>();
  TOPIC_DEFINITIONS.forEach((topic) => slugs.add(topic.slug.toLowerCase()));
  getAllEpisodes().forEach((episode) => {
    (episode.keyTopics ?? []).forEach((topic) => slugs.add(getTopicSlug(topic.slug).toLowerCase()));
  });
  return slugs;
};

export const getPersonStaticSlugs = (): string[] => Array.from(collectSlugsFromPeople());
export const getPlaceStaticSlugs = (): string[] => Array.from(collectSlugsFromPlaces());
export const getTopicStaticSlugs = (): string[] => Array.from(collectSlugsFromTopics());
