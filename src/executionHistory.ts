import * as vscode from 'vscode';
import type { LanguageDefinition } from './languageRegistry';

const HISTORY_KEY = 'smartRunner.executionHistory';
const MAX_HISTORY_ITEMS = 50;

export interface ExecutionHistoryItem {
  id: string;
  languageId: string;
  languageName: string;
  snippetText: string;
  createdAt: string;
}

export class ExecutionHistory {
  constructor(private readonly globalState: vscode.Memento) {}

  getAll(): ExecutionHistoryItem[] {
    return this.globalState.get<ExecutionHistoryItem[]>(HISTORY_KEY, []);
  }

  getLast(): ExecutionHistoryItem | undefined {
    return this.getAll()[0];
  }

  async add(language: LanguageDefinition, snippetText: string): Promise<void> {
    const item: ExecutionHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      languageId: language.id,
      languageName: language.displayName,
      snippetText,
      createdAt: new Date().toISOString()
    };
    const nextItems = [item, ...this.getAll()].slice(0, MAX_HISTORY_ITEMS);

    await this.globalState.update(HISTORY_KEY, nextItems);
  }
}
