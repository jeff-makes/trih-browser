import axios, { AxiosError } from "axios";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ChatCompletionParams {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatCompletionResult {
  model: string;
  content: string;
}

export interface OpenAiClientOptions {
  apiKey?: string;
  primaryModel?: string;
  fallbackModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface OpenAiClient {
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createModelCaller =
  (apiKey: string, model: string, timeoutMs: number, maxRetries: number) =>
  async (params: ChatCompletionParams): Promise<ChatCompletionResult> => {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model,
            messages: params.messages,
            temperature: params.temperature ?? 0
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: timeoutMs
          }
        );

        const [{ message }] = response.data.choices;
        const content: string = message?.content ?? "";
        return {
          model,
          content: content.trim()
        };
      } catch (error) {
        lastError = error;
        const axiosError = error as AxiosError;

        const status = axiosError.response?.status ?? 0;
        const isRetryable = status >= 500 || status === 429 || status === 408 || status === 0;

        attempt += 1;
        if (!isRetryable || attempt >= maxRetries) {
          throw error;
        }

        const backoffMs = Math.min(2 ** attempt * 1000, 10_000);
        await sleep(backoffMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Unknown OpenAI error");
  };

export const createOpenAiClient = (options: OpenAiClientOptions = {}): OpenAiClient => {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }

  const primaryModel = options.primaryModel ?? process.env.OPENAI_MODEL_PRIMARY ?? "gpt-5-nano";
  const fallbackModel = options.fallbackModel ?? process.env.OPENAI_MODEL_FALLBACK ?? "gpt-4o-mini";
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  const callPrimary = createModelCaller(apiKey, primaryModel, timeoutMs, maxRetries);
  const callFallback =
    fallbackModel && fallbackModel !== primaryModel
      ? createModelCaller(apiKey, fallbackModel, timeoutMs, maxRetries)
      : null;

  return {
    async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
      try {
        return await callPrimary(params);
      } catch (error) {
        if (!callFallback) {
          throw error;
        }

        return callFallback(params);
      }
    }
  };
};

export default createOpenAiClient;
