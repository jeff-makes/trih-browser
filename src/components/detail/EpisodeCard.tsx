import Link from "next/link";

import type { PublicEpisode } from "@/types";

import { getPersonHref, getPlaceHref, getTopicHref } from "@/lib/entityLinks";
import { stripAdChoices } from "@/lib/description";

import { PillLink } from "./PillLink";
import styles from "./EpisodeCard.module.css";

const classNames = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export interface EpisodeCardProps {
  episode: PublicEpisode;
  showPeopleCount?: number;
  showPlacesCount?: number;
  showThemesCount?: number;
  showTopicsCount?: number;
  seriesHref?: string | null;
  seriesLabel?: string | null;
  density?: "default" | "compact";
}

const formatYear = (value: number | null): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return value < 0 ? `${Math.abs(value)} BC` : String(value);
};

export function EpisodeCard({
  episode,
  showPeopleCount = 3,
  showPlacesCount = 2,
  showThemesCount = 0,
  showTopicsCount = 2,
  seriesHref,
  seriesLabel,
  density = "default"
}: EpisodeCardProps): JSX.Element {
  const people = (
    episode.people && episode.people.length > 0
      ? episode.people.map((person) => ({
          name: person.name,
          href: getPersonHref(person.name, person.id)
        }))
      : (episode.keyPeople ?? []).map((name) => ({
          name,
          href: getPersonHref(name)
        }))
  ).slice(0, showPeopleCount);
  const places = (
    episode.places && episode.places.length > 0
      ? episode.places.map((place) => ({
          name: place.name,
          href: getPlaceHref(place.name, place.id)
        }))
      : (episode.keyPlaces ?? []).map((name) => ({
          name,
          href: getPlaceHref(name)
        }))
  ).slice(0, showPlacesCount);
  const themes = (episode.keyThemes ?? []).slice(0, showThemesCount);
  const topics = (episode.keyTopics ?? []).slice(0, showTopicsCount);
  const yearFrom = formatYear(episode.yearFrom ?? null);
  const yearTo = formatYear(episode.yearTo ?? null);

  const metaParts = [episode.publishedAt.slice(0, 10)];
  if (yearFrom && yearTo && yearFrom !== yearTo) {
    metaParts.push(`${yearFrom} – ${yearTo}`);
  } else if (yearFrom) {
    metaParts.push(yearFrom);
  }

  const description = stripAdChoices(episode.cleanDescriptionText);
  const summary =
    description.length > 220 ? `${description.slice(0, 200).trim().replace(/[.,;:]?$/, "")}…` : description;

  const cardClass = classNames(styles.card, density === "compact" && styles.cardCompact);

  return (
    <article className={cardClass}>
      <div className={styles.titleRow}>
        <Link href={`/episode/${episode.slug}`} className={styles.titleLink}>
          <span>{episode.cleanTitle}</span>
          {episode.part ? <span className={styles.partBadge}>Part {episode.part}</span> : null}
        </Link>
        <div className={styles.meta}>{metaParts.join(" • ")}</div>
        {seriesHref && seriesLabel ? (
          <div className={styles.seriesContext}>
            From the{" "}
            <Link href={seriesHref} className={styles.seriesLink}>
              {seriesLabel}
            </Link>
          </div>
        ) : null}
      </div>

      <p className={styles.description}>{summary}</p>

      <div className={styles.chipRow}>
        {people.map((person) => (
          <PillLink key={person.href} href={person.href} variant="people">
            {person.name}
          </PillLink>
        ))}
        {places.map((place) => (
          <PillLink key={place.href} href={place.href} variant="places">
            {place.name}
          </PillLink>
        ))}
        {topics.map((topic) => (
          <PillLink
            key={topic.id}
            href={getTopicHref(topic.slug)}
            variant="topics"
            title={topic.isPending ? "Pending topic proposal" : undefined}
          >
            {topic.label}
          </PillLink>
        ))}
        {themes.map((theme) => (
          <PillLink key={theme} href={`/search?theme=${encodeURIComponent(theme)}`} variant="episode">
            {theme.replace(/-/g, " ")}
          </PillLink>
        ))}
      </div>
    </article>
  );
}

export default EpisodeCard;
