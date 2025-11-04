# Pending Entity Workflow

_Last updated: 2025-11-04 (draft v0.1)_

This document describes how the pipeline captures, reviews, and promotes new people/places/topics that the LLM proposes. The goal is to support a **Phase 1 human-in-the-loop QA** while laying the groundwork for an eventual **Phase 2 automated ingestion** once accuracy targets are met.

## File Layout

- `data/pending/people.jsonl`
- `data/pending/places.jsonl`
- `data/pending/topics.jsonl`

Each file stores one JSON object per line. All writes must be append-only to preserve audit history.

### Common Fields

```json
{
  "entityId": "string | null",        // optional provisional slug if suggested; null if not set
  "displayName": "string",            // the exact string returned by the LLM
  "category": "person|place|topic",
  "episodeId": "string",              // source episode ID
  "seriesId": "string | null",
  "proposedAt": "ISO 8601 string",
  "proposedBy": "string",             // pipeline stage (e.g., "llm:episodes")
  "confidence": "high|medium|low",    // model-provided confidence when available
  "notes": "string | null",           // optional rationale from the model
  "registriesVersion": "string"       // git SHA or semantic version of registry snapshots
}
```

### Category-Specific Fields

#### People (`people.jsonl`)

```json
{
  "typeHint": "historical|legendary|mythological|unidentified|religious|null",
  "aliases": ["string"]              // model-suggested aliases (optional)
}
```

#### Places (`places.jsonl`)

```json
{
  "typeHint": "nation|constituent-country|region|city|site|venue|extinct-polity|extinct-site|extinct-city|null",
  "displayContext": "string | null"   // e.g., "Victorian London" → helps pick canonical alias
}
```

#### Topics (`topics.jsonl`)

```json
{
  "typeHint": "conflict|era|civilization|organization|movement|concept|culture|event|biography|mythology|regime|null",
  "relatedTopics": ["string"],        // IDs or labels of existing topics suggested by the model
  "reasoning": "string | null"        // model explanation of relevance
}
```

## Phase 1 — Human Review Loop

1. **Pipeline emits proposals:**  
   - When validation cannot map an LLM output to a canonical entity, it logs an error and appends a pending record.
   - The episode is still published without that chip; `isPending: true` is only used for topics that already exist in `public/episodes.json`.

2. **Curator queue:**  
   - Reviewers consume the JSONL entries (CLI or simple UI).  
   - For each entry they choose:
     - **Approve existing entity:** map the display name to a canonical ID (update registries if necessary).  
     - **Add new entity:** generate a new `id`, curate aliases/types, and append to the canonical registry file.  
     - **Reject:** mark the suggestion as invalid (recorded in `notes`, no registry change).

3. **Audit trail:**  
   - Approval actions append a `reviewedAt`, `reviewedBy`, and `resolution` field to the original JSONL record (in-place scribes are avoided; use an additional JSONL file or a companion `data/pending/reviews.jsonl` for immutable logging).
   - Rejected items stay in the queue for historical context but are marked `resolved: false` with a reason.

4. **Registry updates:**  
   - After edits to `data/rules/*.json`, run the pipeline against the affected episodes to confirm the new entity resolves correctly.
   - Commit both the registry change and the pending review record.

### Tooling Hints

- Provide a CLI helper (`scripts/pending-review.ts`) to list, approve, reject, and diff entries.
- Consider generating weekly reports summarising outstanding pending items by category.

## Phase 2 — Automation Goal

Objective: reach a sustained accuracy level where the vast majority of proposals are correct and can be self-approved by the pipeline.

### Success Criteria (to be refined)

- ≥95 % of proposals over the prior 4 weeks are approved without changes.
- No critical false positives (e.g., a misleading entity) observed during that window.
- Prompt/validator tests cover the collected edge cases (episodes highlighted in Gemini’s analysis).

### Automation Plan

1. **Shadow approvals:** continue logging proposed entities, but allow a feature flag (`AUTO_APPROVE_NEW_ENTITIES`) to auto-append to the canonical registry when confidence ≥ threshold and no conflicts exist.
2. **Fallback path:** if the auto-approval encounters a collision (duplicate alias, conflicting type), it falls back to the Phase 1 queue.
3. **Monitoring:** metrics should track the number of auto-approved vs. manual entries and surface anomalies (e.g., sudden spike in rejections).

## Migration Notes

- The deprecated topic `theme-parks-and-disney` is retained solely to migrate existing data. Once the backfill replaces it with the canonical IDs, it will be removed from the registry.
- Include alias additions (e.g., `Der Führer`, `U.K.`) in the next LLM prompt revision to minimise new pending proposals.

## Open Items

- Build developer tooling for JSONL review/approval.
- Define KPIs for accuracy measurement (e.g., false positive rate, review turnaround time).
- Evaluate whether to store proposals in a lightweight SQLite/CSV alternative once volume grows.
