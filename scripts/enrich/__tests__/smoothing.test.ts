import test from "node:test";
import assert from "node:assert/strict";
import { applySeriesSmoothing, prepareState } from "../enrich";
import type { Episode } from "../types";

const episode = (episodeNumber: number, title: string): Episode => ({
  episode: episodeNumber,
  title_feed: title,
  title_sheet: null,
  description: null,
  pubDate: "2023-01-01",
  slug: `slug-${episodeNumber}`,
});

test("series smoothing fills missing years", () => {
  const first = prepareState(episode(1, "Series Part I"), null);
  first.seriesKey = "series";
  first.seriesTitle = "Series";
  first.seriesPart = 1;
  first.yearFrom = 1800;
  first.yearTo = 1805;
  first.yearPrimary = 1802;
  first.scope = "range";
  first.confidence = 0.8;

  const second = prepareState(episode(2, "Series Part II"), null);
  second.seriesKey = "series";
  second.seriesTitle = "Series";
  second.seriesPart = 2;

  applySeriesSmoothing([first, second]);

  assert.equal(second.yearFrom, 1800);
  assert.equal(second.yearTo, 1805);
  assert.equal(second.yearPrimary, 1802);
  assert.equal(second.scope, "range");
  assert.equal(second.source, "series");
  assert.ok((second.confidence ?? 0) > 0.5);
});
