"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { PublicEpisode, PublicSeries } from "@/types";

import { EpisodeCard } from "@/components/detail";

import styles from "./EntityEpisodes.module.css";

export interface EntityEpisodeEntry {
  episode: PublicEpisode;
  series: PublicSeries | null;
}

interface EntityEpisodesProps {
  entries: EntityEpisodeEntry[];
}

const PAGE_SIZE = 20;

export function EntityEpisodes({ entries }: EntityEpisodesProps): JSX.Element {
  const [groupBySeries, setGroupBySeries] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const seriesCount = useMemo(() => {
    const unique = new Set(entries.map((entry) => entry.series?.seriesId).filter(Boolean));
    return unique.size;
  }, [entries]);

  const canGroupBySeries = entries.length > 5 && seriesCount > 1;
  const effectiveGroupBySeries = groupBySeries && canGroupBySeries;
  const isCompactList = entries.length <= 3;

  useEffect(() => {
    if (!canGroupBySeries && groupBySeries) {
      setGroupBySeries(false);
    }
  }, [canGroupBySeries, groupBySeries]);

  const visibleEntries = effectiveGroupBySeries ? entries : entries.slice(0, visibleCount);
  const hasMore = !effectiveGroupBySeries && visibleCount < entries.length;

  const grouped = useMemo(() => {
    if (!effectiveGroupBySeries) {
      return [];
    }
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        href: string | null;
        episodes: EntityEpisodeEntry[];
      }
    >();

    entries.forEach((entry) => {
      const key = entry.series?.seriesId ?? "__standalone__";
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: entry.series?.seriesTitle ?? "Standalone episodes",
          href: entry.series ? `/series/${entry.series.slug}` : null,
          episodes: []
        });
      }
      groups.get(key)!.episodes.push(entry);
    });

    return Array.from(groups.values());
  }, [entries, effectiveGroupBySeries]);

  if (entries.length === 0) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>No episodes reference this entry yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className={isCompactList ? styles.wrapperCompact : styles.wrapper}>
      {canGroupBySeries || entries.length > 3 ? (
        <div className={styles.controls}>
          {canGroupBySeries ? (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => {
                setGroupBySeries((prev) => !prev);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {effectiveGroupBySeries ? "Show chronological list" : "Group by series"}
            </button>
          ) : null}
          {entries.length > 3 ? (
            <span className={styles.summary}>
              Showing {effectiveGroupBySeries ? entries.length : visibleEntries.length} of {entries.length} episode
              {entries.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}

      {effectiveGroupBySeries ? (
        <div className={styles.groupStack}>
          {grouped.map((group) => (
            <details key={group.key} className={styles.group} open>
              <summary>
                {group.label}
                {group.href ? (
                  <Link href={group.href} className={styles.groupLink}>
                    View series
                  </Link>
                ) : null}
              </summary>
              <div className={styles.groupEpisodes}>
                {group.episodes.map(({ episode, series }) => (
                  <EpisodeCard
                    key={episode.episodeId}
                    episode={episode}
                    seriesHref={series ? `/series/${series.slug}` : null}
                    seriesLabel={series?.seriesTitle ?? null}
                  />
                ))}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <ol className={isCompactList ? styles.episodeListCompact : styles.episodeList}>
          {visibleEntries.map(({ episode, series }) => (
            <li key={episode.episodeId}>
              <EpisodeCard
                episode={episode}
                seriesHref={series ? `/series/${series.slug}` : null}
                seriesLabel={series?.seriesTitle ?? null}
                density={isCompactList ? "compact" : "default"}
              />
            </li>
          ))}
        </ol>
      )}

      {hasMore ? (
        <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
          Load more episodes
        </button>
      ) : null}
    </div>
  );
}

export default EntityEpisodes;
