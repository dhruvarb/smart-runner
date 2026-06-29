import * as vscode from 'vscode';
import { getAiProvider, type AiProviderDefinition } from './aiProviderRegistry';

export interface AiConfiguration {
  provider: AiProviderDefinition;
  model: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  baseUrl: string;
}

export function getAiConfiguration(): AiConfiguration {
  const config = vscode.workspace.getConfiguration('smartRunner.ai');
  const provider = getAiProvider(config.get('provider', 'gemini'));

  return {
    provider,
    model: config.get('model', provider.defaultModel),
    temperature: config.get('temperature', 0.2),
    maxTokens: config.get('maxTokens', 4096),
    streaming: config.get('streaming', true),
    baseUrl: config.get('baseUrl', provider.defaultBaseUrl)
  };
}
