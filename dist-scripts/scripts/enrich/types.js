"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InferenceCacheSchema = exports.UmbrellaSummarySchema = exports.CollectionsSchema = exports.CollectionSchema = exports.CachedInferenceSchema = exports.LLMInferenceSchema = exports.EnrichedEpisodeSchema = exports.EnrichedFieldsSchema = exports.EpisodeSchema = exports.ScopeSchema = void 0;
const zod_1 = require("zod");
exports.ScopeSchema = zod_1.z.enum(["point", "range", "broad", "unknown"]);
const NullableText = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number(), zod_1.z.null()])
    .optional()
    .transform((value) => {
    if (value === undefined || value === null)
        return null;
    return String(value);
});
exports.EpisodeSchema = zod_1.z
    .object({
    episode: zod_1.z.number(),
    title_feed: NullableText,
    title_sheet: NullableText,
    description: NullableText,
    pubDate: zod_1.z.string(),
    slug: zod_1.z.string(),
    eras: zod_1.z.array(zod_1.z.string()).optional(),
    regions: zod_1.z.array(zod_1.z.string()).optional(),
})
    .passthrough();
exports.EnrichedFieldsSchema = zod_1.z.object({
    seriesKey: zod_1.z.string().nullable(),
    seriesTitle: zod_1.z.string().nullable(),
    seriesPart: zod_1.z.number().int().positive().nullable(),
    yearPrimary: zod_1.z.number().int().nullable(),
    yearFrom: zod_1.z.number().int().nullable(),
    yearTo: zod_1.z.number().int().nullable(),
    scope: exports.ScopeSchema,
    umbrellas: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number().min(0).max(1).nullable(),
    source: zod_1.z.enum(["rules", "series", "century", "llm", "override", "mixed"]).nullable(),
});
exports.EnrichedEpisodeSchema = exports.EpisodeSchema.merge(exports.EnrichedFieldsSchema);
exports.LLMInferenceSchema = zod_1.z.object({
    seriesTitle: zod_1.z.string().nullable(),
    seriesPart: zod_1.z.number().int().positive().nullable(),
    yearPrimary: zod_1.z.number().int().nullable(),
    yearFrom: zod_1.z.number().int().nullable(),
    yearTo: zod_1.z.number().int().nullable(),
    scope: exports.ScopeSchema,
    umbrellas: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.number().min(0).max(1),
    rationale: zod_1.z.string(),
});
exports.CachedInferenceSchema = exports.LLMInferenceSchema.omit({ rationale: true }).extend({
    scope: exports.ScopeSchema,
});
exports.CollectionSchema = zod_1.z.object({
    key: zod_1.z.string(),
    title: zod_1.z.string(),
    count: zod_1.z.number().int(),
    episodes: zod_1.z.array(zod_1.z.number().int()),
    slugs: zod_1.z.array(zod_1.z.string()),
    parts: zod_1.z.array(zod_1.z.number().int()),
    years: zod_1.z.object({
        min: zod_1.z.number().int().nullable(),
        max: zod_1.z.number().int().nullable(),
    }),
});
exports.CollectionsSchema = zod_1.z.array(exports.CollectionSchema);
exports.UmbrellaSummarySchema = zod_1.z.object({
    index: zod_1.z.record(zod_1.z.string(), zod_1.z.array(zod_1.z.number().int())),
    counts: zod_1.z.record(zod_1.z.string(), zod_1.z.number().int()),
});
exports.InferenceCacheSchema = zod_1.z.record(zod_1.z.string(), exports.CachedInferenceSchema);
