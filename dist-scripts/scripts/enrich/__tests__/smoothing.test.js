"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const enrich_1 = require("../enrich");
const episode = (episodeNumber, title) => ({
    episode: episodeNumber,
    title_feed: title,
    title_sheet: null,
    description: null,
    pubDate: "2023-01-01",
    slug: `slug-${episodeNumber}`,
});
(0, node_test_1.default)("series smoothing fills missing years", () => {
    const first = (0, enrich_1.prepareState)(episode(1, "Series Part I"), null);
    first.seriesKey = "series";
    first.seriesTitle = "Series";
    first.seriesPart = 1;
    first.yearFrom = 1800;
    first.yearTo = 1805;
    first.yearPrimary = 1802;
    first.scope = "range";
    first.confidence = 0.8;
    const second = (0, enrich_1.prepareState)(episode(2, "Series Part II"), null);
    second.seriesKey = "series";
    second.seriesTitle = "Series";
    second.seriesPart = 2;
    (0, enrich_1.applySeriesSmoothing)([first, second]);
    strict_1.default.equal(second.yearFrom, 1800);
    strict_1.default.equal(second.yearTo, 1805);
    strict_1.default.equal(second.yearPrimary, 1802);
    strict_1.default.equal(second.scope, "range");
    strict_1.default.equal(second.source, "series");
    strict_1.default.ok((second.confidence ?? 0) > 0.5);
});
