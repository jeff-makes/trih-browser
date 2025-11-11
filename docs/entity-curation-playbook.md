# Entity Curation Playbook

This playbook captures the conventions we use when approving LLM proposals for people, places, and topics. Follow it whenever you review `data/errors.jsonl` so the registries stay deterministic and future LLM runs auto-resolve most entities.

## Prerequisites
- Read `codex-notes.md` and `docs/SYSTEM_OVERVIEW.md` at session start.
- Before curating, run `npm run dev:pipeline -- --plan` (or review the latest CI plan run) so you know which stages produced the pending proposals.
- Load secrets if you expect to recompose artefacts after editing the registries: `source .env.local && npm run dev:pipeline`.

## Workflow
1. **Inspect proposals**  
   Use `rg '"personProposal"' data/errors.jsonl` (or place/topic equivalents) to group proposals by episode/series. Capture the cache key and fingerprint so you can re-run targeted `--force-llm` commands later if needed.
2. **Decide add vs. map vs. reject**  
   Apply the criteria below for each entity type. Prefer mapping/aliasing to existing entries whenever a reusable canonical ID already exists.
3. **Update registries**  
   - People: `data/rules/people.json` (sorted alphabetically by ID).  
   - Places: `data/rules/places.json`.  
   - Topics: `data/rules/topics.json` (keep aliases tight; no single-use topics).
4. **Log the decision**  
   Append a JSON record to `data/pending/reviews.jsonl` with `reviewedAt`, `reviewedBy`, batch label, and the arrays/maps describing what changed (accepted, rejected, mapped, converted). Every curated proposal must have a review entry.
5. **Rehydrate composer outputs**  
   Run `OPENAI_API_KEY=dummy npm run dev:pipeline -- --max-llm-calls 0` so the UI artefacts incorporate the updated registries without consuming new tokens.
6. **Force reruns when necessary**  
   If you accept entities that the latest cache run rejected (e.g., because the validator lacked the ID), re-run `npm run dev:pipeline -- --force-llm <comma-separated IDs>` with a low `--max-llm-calls` limit so the cache and artefacts pick up the new canonical references.

## Decision Criteria

### People
- **Add** when the person is historical or modern and likely to recur (e.g., royal figures, heads of state, authors frequently mentioned in arcs).
- **Map** mythological or fictional proposals to the nearest canonical ID if it already exists. If not, treat mythology the same as historical people but capture their type (`person:mythological`).
- **Reject** vague labels (“The King”, “The Artist”) unless we can map them unambiguously.
- **Naming**: lowercase kebab-case IDs (e.g., `catherine-of-aragon`), `preferredName` in title case, include `aliases` for common nicknames/spellings.

### Places
- **Add** for geographic entities that anchor a narrative (cities, regions, battle sites) and are likely to appear in other episodes.
- **Map** when a proposal is an alias (“The Big Apple” → `new-york-city`).
- **Convert** to topics if the label describes a cultural concept rather than a physical location, and document the conversion in the review entry.
- **Reject** oversized regions unless we need them for context (`Europe`, `Asia`)—prefer more specific entries.

### Topics
- **Add** only when the concept applies to multiple episodes or is a long-term thematic pillar (e.g., `british-royal-family`, `natural-history`).
- **Map** most new proposals to an existing topic or an alias list to avoid single-use clutter.
- **Reject** proposals that simply restate an episode title or describe a one-off event already covered by a people/place combo.
- **Document** any new topic in the review log along with any alias mappings so future proposals auto-resolve.

## Validation & Follow-up
- After recomposition, re-run `npm run schema:check` if you touched schema-sensitive data.
- Monitor the next scheduled GitHub Actions pipeline. If validator warnings reappear for entities you just approved, confirm that the registries were committed/pushed and re-trigger the force rerun for affected IDs.
- Keep this document updated when rules change (e.g., new naming conventions, additional entity types, validator tweaks).
