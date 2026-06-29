import * as vscode from 'vscode';
import type { AiProviderDefinition } from './aiProviderRegistry';

const SECRET_PREFIX = 'smartRunner.ai.apiKey';

export class AiSecretStorage {
  constructor(private readonly secrets: vscode.SecretStorage) {}

  getApiKey(provider: AiProviderDefinition): Thenable<string | undefined> {
    return this.secrets.get(secretKey(provider));
  }

  async storeApiKey(
    provider: AiProviderDefinition,
    apiKey: string
  ): Promise<void> {
    await this.secrets.store(secretKey(provider), apiKey);
  }

  async deleteApiKey(provider: AiProviderDefinition): Promise<void> {
    await this.secrets.delete(secretKey(provider));
  }
}

function secretKey(provider: AiProviderDefinition): string {
  return `${SECRET_PREFIX}.${provider.id}`;
}
