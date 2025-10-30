Implementation Plan (Revised)
This document breaks down the PRP-pipeline.md specification into a sequence of concrete, implementable steps. The architecture is designed for local development and seamless deployment on Vercel using Serverless Functions and Vercel Blob.

Implementation Plan Checklist
- [x] Step 1 — Project Setup & Foundational Code
- [x] Step 2 — Define Core Pipeline Logic as Modular Functions
- [x] Step 3 — Create Pipeline Orchestrators (Local & Vercel)
- [x] Step 4 — Implement LLM Enrichment
- [x] Step 5 — Implement Final Compose & Validation Steps
- [x] Step 6 — Migration, CI, and Deployment

Step 1 — Project Setup & Foundational Code
Goal: Establish the project structure, define types from schemas, and create the core deterministic utilities that all other parts of the pipeline will depend on.
Prompt for AI:
```code
Scaffold a new Next.js TypeScript project. Then perform the following setup:
1.  **Add Dependencies:** Add `axios`, `xml2js`, `ajv`, and `@vercel/blob` to `package.json`.
2.  **Create Schemas:** Create the `schema/` directory and populate it with three files: `episode.public.schema.json`, `series.public.schema.json`, and `cache.llm.schema.json`. For now, make them valid but empty JSON schema files (`{ "$schema": "http://json-schema.org/draft-07/schema#" }`).
3.  **Define Types:** Create `src/types.ts`. Based on the tables in `PRD#4.2`, define and export TypeScript interfaces for all data models (e.g., `RawEpisode`, `ProgrammaticEpisode`, `PublicEpisode`, etc.).
4.  **Create Core Utilities:** Create the `src/lib/` directory and add two files:
    -   `stableStringify.ts`: Export a function `stableStringify(obj)` that returns a JSON string with alphabetically sorted keys.
    -   `slug.ts`: Export a function `toSlug(str)` that implements the algorithm from `PRD#22`.
5.  **Setup Directories:** Create empty `data/` and `public/` directories at the project root, each with a `.gitkeep` file.
```

Step 2 — Define Core Pipeline Logic as Modular Functions
Goal: Create a separate, testable function for each stage of the pipeline. These functions will read from an in-memory state and return a new state, without directly touching the filesystem or a blob store.
Prompt for AI:
```code
Create a new directory `src/pipeline`. Inside, create the following modular, stateless function files:

1.  **`fetcher.ts`:** Create a function `runFetchStep(existingRawEpisodes)` that fetches the RSS feed, parses it, and returns an object containing `{ newRawEpisodes: RawEpisode[], dailySnapshot: object }`. It should identify new episodes by comparing GUIDs against `existingRawEpisodes`.

2.  **`enricher.ts`:** Create a function `runProgrammaticEnrichment(rawEpisodes)` that takes an array of `RawEpisode` objects and returns a map of `{[episodeId]: ProgrammaticEpisode}`. This function should contain all the logic for cleaning text, extracting credits, and generating fingerprints as specified in the PRD.

3.  **`grouper.ts`:** Create a function `runSeriesGrouping(programmaticEpisodes)` that takes the programmatic episode map and returns `{ rawSeries: object, programmaticSeries: object }`. This file will contain all the logic for arc detection, part parsing, and series-level aggregation.
```

Step 3 — Create Pipeline Orchestrators (Local & Vercel)
Goal: Create the entry points that will call the modular pipeline functions. One for local development (using the filesystem) and one for Vercel (using Vercel Blob).
Prompt for AI:
```code
Now, create the two main entry points for the pipeline:

1.  **Local Runner (`src/run-local-pipeline.ts`):**
    -   This script will be run via `ts-node`.
    -   It should read the `data/*.json` files from the local filesystem.
    -   It will call the modular functions from `src/pipeline` in the correct sequence, passing data between them.
    -   Finally, it will write the updated artifacts back to the local `data/` and `public/` directories using `stableStringify`.
    -   Create a corresponding `dev:pipeline` script in `package.json`.

2.  **Vercel Cron Job Handler (`app/api/cron/run-pipeline/route.ts`):**
    -   This file should export a `GET` function for Vercel's Cron Jobs.
    -   It will be almost identical to the local runner, but instead of reading/writing to the filesystem, it will use the `@vercel/blob` client to `get` and `put` the JSON artifacts from Vercel's Blob storage.
```

Step 4 — Implement LLM Enrichment
Goal: Build the LLM client and the functions that call it, respecting caching, rate limits, and error handling.
Prompt for AI:
```code
Create an OpenAI Client (src/lib/openai.ts): This module should handle API calls, read environment variables for keys and models (OPENAI_MODEL_PRIMARY, OPENAI_MODEL_FALLBACK), and implement the retry/timeout logic from PRD#8.1.
Implement LLM Logic: In src/pipeline/enricher.ts (or a new llmEnricher.ts file), create two new functions: runLlmEpisodeEnrichment(programmaticEpisodes, existingCache) and runLlmSeriesEnrichment(programmaticSeries, existingCache).
These functions must implement the full caching logic based on {id}:{fingerprint} keys.
They will call the OpenAI client with the precise prompts from PRD#5.6.1.
They should handle the --max-llm-calls flag and log errors to an in-memory error array (to be written to the blob store later).
They should return the updated cache objects.
```

### Step 5 — Implement Final Compose & Validation Steps

**Goal:** Build the final steps of the pipeline: composing the public files and validating all outputs against their schemas.

**Prompt for AI:**
```code
Implement the Composer: In src/pipeline/composer.ts, create a function runComposeStep(allData) that takes all the raw, programmatic, and LLM data objects and produces the final publicEpisodes and publicSeries arrays, applying all precedence rules from PRD#9 and sorting correctly.
Implement the Validator: In src/pipeline/validator.ts, create a function runValidation(allArtifacts). This function will use ajv to validate all generated JSON files against their corresponding schemas in the schema/ directory. It must also perform all referential integrity checks from PRD#10. It should throw an error if validation fails.
```

### Step 6 — Migration, CI, and Deployment

**Goal:** Finalize the project with operational scripts, a CI workflow, and deployment configuration.

**Prompt for AI:**
```code
Create the final supporting files for the project:
Migration Script: scripts/migrate-legacy-caches.mjs as specified in PRD#17.
GitHub Actions Workflow: .github/workflows/ci.yml. This workflow should run on every push to main or a PR. It should install dependencies, run linting, execute the pipeline via the local runner (npm run dev:pipeline), and run the golden file tests.
Vercel Configuration: Create a vercel.json file. Define a cron job that triggers the app/api/cron/run-pipeline/route.ts endpoint once daily. Ensure environment variables from the PRD are listed as required.
```
