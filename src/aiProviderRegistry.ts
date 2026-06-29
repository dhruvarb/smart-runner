export type AiProviderId =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'groq'
  | 'openrouter'
  | 'ollama'
  | 'lmstudio';

export interface AiProviderDefinition {
  id: AiProviderId;
  displayName: string;
  requiresApiKey: boolean;
  defaultModel: string;
  defaultBaseUrl: string;
  protocol: 'gemini' | 'anthropic' | 'openai-compatible';
}

export const AI_PROVIDERS: AiProviderDefinition[] = [
  {
    id: 'gemini',
    displayName: 'Gemini',
    requiresApiKey: true,
    defaultModel: 'gemini-2.5-pro',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    protocol: 'gemini'
  },
  {
    id: 'openai',
    displayName: 'OpenAI',
    requiresApiKey: true,
    defaultModel: 'gpt-4.1',
    defaultBaseUrl: 'https://api.openai.com/v1',
    protocol: 'openai-compatible'
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic',
    requiresApiKey: true,
    defaultModel: 'claude-sonnet-4-20250514',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    protocol: 'anthropic'
  },
  {
    id: 'groq',
    displayName: 'Groq',
    requiresApiKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    protocol: 'openai-compatible'
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    requiresApiKey: true,
    defaultModel: 'openai/gpt-4.1',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    protocol: 'openai-compatible'
  },
  {
    id: 'ollama',
    displayName: 'Ollama',
    requiresApiKey: false,
    defaultModel: 'llama3.2',
    defaultBaseUrl: 'http://localhost:11434/v1',
    protocol: 'openai-compatible'
  },
  {
    id: 'lmstudio',
    displayName: 'LM Studio',
    requiresApiKey: false,
    defaultModel: 'local-model',
    defaultBaseUrl: 'http://localhost:1234/v1',
    protocol: 'openai-compatible'
  }
];

export function getAiProvider(providerId: string): AiProviderDefinition {
  return (
    AI_PROVIDERS.find((provider) => provider.id === providerId) ??
    AI_PROVIDERS[0]
  );
}

export function getAiProviderNames(): string {
  return AI_PROVIDERS.map((provider) => provider.displayName).join(', ');
}
