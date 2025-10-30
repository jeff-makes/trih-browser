# Environment Configuration

The pipeline consumes a small set of environment variables in both local development and production deployments.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | API token used by the LLM enrichment steps. Must be available locally and configured as a secret for CI/Vercel. |
| `OPENAI_MODEL_PRIMARY` | No (default `gpt-5-nano`) | Overrides the primary model used for OpenAI requests. |
| `OPENAI_MODEL_FALLBACK` | No (default `gpt-4o-mini`) | Secondary model used when the primary model is unavailable. |
| `BLOB_READ_WRITE_TOKEN` | Yes in Vercel | Token for interacting with Vercel Blob storage inside the serverless orchestrator. |

For local development, export the variables (or create a `.env.local` file recognised by Next.js tooling). In CI and Vercel, configure them as encrypted secrets using the names referenced in `.github/workflows/ci.yml` and `vercel.json`.
