import * as vscode from 'vscode';

export interface LanguageDefinition {
  id: string;
  displayName: string;
  fileExtension: string;
  tempFileName: string;
}

const SUPPORTED_LANGUAGES = new Map<string, LanguageDefinition>([
  [
    'python',
    {
      id: 'python',
      displayName: 'Python',
      fileExtension: '.py',
      tempFileName: 'snippet.py'
    }
  ],
  [
    'javascript',
    {
      id: 'javascript',
      displayName: 'JavaScript',
      fileExtension: '.js',
      tempFileName: 'snippet.js'
    }
  ],
  [
    'typescript',
    {
      id: 'typescript',
      displayName: 'TypeScript',
      fileExtension: '.ts',
      tempFileName: 'snippet.ts'
    }
  ],
  [
    'c',
    {
      id: 'c',
      displayName: 'C',
      fileExtension: '.c',
      tempFileName: 'snippet.c'
    }
  ],
  [
    'cpp',
    {
      id: 'cpp',
      displayName: 'C++',
      fileExtension: '.cpp',
      tempFileName: 'snippet.cpp'
    }
  ],
  [
    'java',
    {
      id: 'java',
      displayName: 'Java',
      fileExtension: '.java',
      tempFileName: 'Main.java'
    }
  ],
  [
    'go',
    {
      id: 'go',
      displayName: 'Go',
      fileExtension: '.go',
      tempFileName: 'snippet.go'
    }
  ],
  [
    'rust',
    {
      id: 'rust',
      displayName: 'Rust',
      fileExtension: '.rs',
      tempFileName: 'snippet.rs'
    }
  ]
]);

export function detectLanguage(
  document: vscode.TextDocument | undefined
): LanguageDefinition | undefined {
  if (!document) {
    return undefined;
  }

  return SUPPORTED_LANGUAGES.get(document.languageId);
}

export function getLanguageById(languageId: string): LanguageDefinition | undefined {
  return SUPPORTED_LANGUAGES.get(languageId);
}

export function getSupportedLanguageNames(): string {
  return [...SUPPORTED_LANGUAGES.values()]
    .map((language) => language.displayName)
    .join(', ');
}
