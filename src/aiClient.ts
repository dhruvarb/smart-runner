import type { AiConfiguration } from './aiConfiguration';

export interface AiRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface AiResponse {
  text: string;
}

export class AiClient {
  async send(
    config: AiConfiguration,
    apiKey: string | undefined,
    request: AiRequest
  ): Promise<AiResponse> {
    validateProviderAccess(config, apiKey);

    switch (config.provider.protocol) {
      case 'gemini':
        return sendGeminiRequest(config, apiKey, request);
      case 'anthropic':
        return sendAnthropicRequest(config, apiKey, request);
      case 'openai-compatible':
        return sendOpenAiCompatibleRequest(config, apiKey, request);
    }
  }
}

function validateProviderAccess(
  config: AiConfiguration,
  apiKey: string | undefined
): void {
  if (config.provider.requiresApiKey && !apiKey) {
    throw new Error(
      `${config.provider.displayName} requires an API key. Run "Smart Runner: Add or Update AI API Key".`
    );
  }

  if (!config.baseUrl.trim()) {
    throw new Error(`${config.provider.displayName} requires a base URL.`);
  }
}

async function sendOpenAiCompatibleRequest(
  config: AiConfiguration,
  apiKey: string | undefined,
  request: AiRequest
): Promise<AiResponse> {
  const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(config.provider.id === 'openrouter'
        ? {
            'HTTP-Referer': 'https://github.com/smart-runner/smart-runner',
            'X-Title': 'Smart Runner'
          }
        : {})
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt
        },
        {
          role: 'user',
          content: request.userPrompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false
    })
  });
  const payload = await readJsonResponse(response);
  const text = payload.choices?.[0]?.message?.content;

  if (typeof text !== 'string') {
    throw new Error('The AI provider returned an unexpected response.');
  }

  return { text };
}

async function sendGeminiRequest(
  config: AiConfiguration,
  apiKey: string | undefined,
  request: AiRequest
): Promise<AiResponse> {
  const url = `${trimTrailingSlash(config.baseUrl)}/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(apiKey ?? '')}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: request.systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: request.userPrompt }]
        }
      ],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens
      }
    })
  });
  const payload = await readJsonResponse(response);
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('');

  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('Gemini returned an unexpected response.');
  }

  return { text };
}

async function sendAnthropicRequest(
  config: AiConfiguration,
  apiKey: string | undefined,
  request: AiRequest
): Promise<AiResponse> {
  const response = await fetch(`${trimTrailingSlash(config.baseUrl)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey ?? '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false
    })
  });
  const payload = await readJsonResponse(response);
  const text = payload.content
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('');

  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('Anthropic returned an unexpected response.');
  }

  return { text };
}

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  let payload: any;

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload.error?.message ??
      payload.message ??
      `AI request failed with HTTP ${response.status}.`;
    throw new Error(sanitizeErrorMessage(message));
  }

  return payload;
}

function sanitizeErrorMessage(message: string): string {
  return message.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]');
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
