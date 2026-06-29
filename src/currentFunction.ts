import * as vscode from 'vscode';
import type { LanguageDefinition } from './languageRegistry';
import type { SnippetSelection } from './selectionEngine';

export function collectCurrentFunctionSnippet(
  editor: vscode.TextEditor,
  language: LanguageDefinition
): SnippetSelection | undefined {
  const startLine = findFunctionStartLine(editor.document, editor.selection.active.line, language);
  if (startLine === undefined) {
    return undefined;
  }

  const endLine =
    language.id === 'python'
      ? findPythonBlockEndLine(editor.document, startLine)
      : findBraceBlockEndLine(editor.document, startLine);

  const range = new vscode.Range(
    new vscode.Position(startLine, 0),
    editor.document.lineAt(endLine).range.end
  );
  const text = editor.document.getText(range);

  return text.trim()
    ? {
        range,
        text
      }
    : undefined;
}

function findFunctionStartLine(
  document: vscode.TextDocument,
  cursorLine: number,
  language: LanguageDefinition
): number | undefined {
  for (let lineNumber = cursorLine; lineNumber >= 0; lineNumber -= 1) {
    const line = document.lineAt(lineNumber).text;
    if (isFunctionStart(line, language)) {
      return lineNumber;
    }
  }

  return undefined;
}

function isFunctionStart(line: string, language: LanguageDefinition): boolean {
  if (language.id === 'python') {
    return /^\s*(?:def|class)\s+/.test(line);
  }

  return (
    /^\s*(?:export\s+)?(?:async\s+)?function\s+/.test(line) ||
    /^\s*(?:export\s+)?(?:const|let|var)\s+[A-Za-z_][A-Za-z0-9_]*\s*=/.test(line) ||
    /^\s*(?:public\s+)?(?:class|struct)\s+/.test(line) ||
    /^\s*(?:func|fn)\s+/.test(line) ||
    /\)\s*(?:const\s*)?\{?\s*$/.test(line)
  );
}

function findPythonBlockEndLine(
  document: vscode.TextDocument,
  startLine: number
): number {
  const startIndent = countIndent(document.lineAt(startLine).text);

  for (let lineNumber = startLine + 1; lineNumber < document.lineCount; lineNumber += 1) {
    const line = document.lineAt(lineNumber).text;
    if (line.trim() && countIndent(line) <= startIndent) {
      return lineNumber - 1;
    }
  }

  return document.lineCount - 1;
}

function findBraceBlockEndLine(
  document: vscode.TextDocument,
  startLine: number
): number {
  let braceDepth = 0;
  let opened = false;

  for (let lineNumber = startLine; lineNumber < document.lineCount; lineNumber += 1) {
    const line = document.lineAt(lineNumber).text;
    braceDepth += countMatches(line, '{');
    if (braceDepth > 0) {
      opened = true;
    }
    braceDepth -= countMatches(line, '}');

    if (opened && braceDepth <= 0) {
      return lineNumber;
    }
  }

  return startLine;
}

function countIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function countMatches(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
