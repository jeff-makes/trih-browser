const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export default class OpenAI {
  constructor(options = {}) {
    this.apiKey = options.apiKey ?? null;
    this.baseURL = options.baseURL ?? DEFAULT_BASE_URL;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.chat = {
      completions: {
        create: (payload) => this.#createChatCompletion(payload),
      },
    };
  }

  async #createChatCompletion(payload) {
    if (!this.apiKey) {
      const error = new Error('Missing OpenAI API key');
      error.status = 401;
      throw error;
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...this.defaultHeaders,
      },
      body: JSON.stringify(payload ?? {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`OpenAI API error (${response.status}): ${errorText}`);
      error.status = response.status;
      error.details = errorText;
      throw error;
    }

    return response.json();
  }
}
