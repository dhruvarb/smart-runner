import type * as vscode from 'vscode';
import type { LanguageDefinition } from './languageRegistry';

export interface DependencyResolutionResult {
  runnableText: string;
  includedDependencies: string[];
  unresolvedDependencies: string[];
}

interface Definition {
  name: string;
  text: string;
  startLine: number;
}

const RESERVED_WORDS = new Set([
  'and',
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'def',
  'else',
  'except',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'let',
  'new',
  'null',
  'return',
  'switch',
  'throw',
  'true',
  'try',
  'var',
  'while',
  'with'
]);

const KNOWN_GLOBALS = new Set([
  'Array',
  'Boolean',
  'Date',
  'Error',
  'JSON',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'Set',
  'String',
  'console',
  'dict',
  'enumerate',
  'float',
  'input',
  'int',
  'len',
  'list',
  'log',
  'max',
  'min',
  'print',
  'range',
  'set',
  'str',
  'sum',
  'tuple'
]);

export function resolveDependencies(
  document: vscode.TextDocument,
  language: LanguageDefinition,
  selectedText: string
): DependencyResolutionResult {
  return resolveDependenciesFromText(document.getText(), language, selectedText);
}

export function resolveDependenciesFromText(
  documentText: string,
  language: LanguageDefinition,
  selectedText: string
): DependencyResolutionResult {
  const definitions = collectDefinitions(documentText, language);
  const selectedDefinedNames = collectLocalNames(selectedText, language);
  const includedDefinitions = new Map<string, Definition>();
  const unresolvedNames = new Set<string>();
  const queue = collectReferencedNames(selectedText, language);

  for (let index = 0; index < queue.length; index += 1) {
    const name = queue[index];

    if (selectedDefinedNames.has(name) || includedDefinitions.has(name)) {
      continue;
    }

    const definition = definitions.get(name);
    if (!definition) {
      unresolvedNames.add(name);
      continue;
    }

    if (selectedText.includes(definition.text)) {
      selectedDefinedNames.add(name);
      continue;
    }

    includedDefinitions.set(name, definition);

    const definitionLocalNames = collectLocalNames(definition.text, language);

    for (const nestedName of collectReferencedNames(definition.text, language)) {
      if (
        !selectedDefinedNames.has(nestedName) &&
        !definitionLocalNames.has(nestedName) &&
        !includedDefinitions.has(nestedName) &&
        !queue.includes(nestedName)
      ) {
        queue.push(nestedName);
      }
    }
  }

  const includedDependencies = [...includedDefinitions.values()]
    .sort((left, right) => left.startLine - right.startLine)
    .map((definition) => definition.text);

  return {
    runnableText: [...new Set(includedDependencies), selectedText].join('\n\n'),
    includedDependencies,
    unresolvedDependencies: [...unresolvedNames].sort()
  };
}

function collectLocalNames(
  text: string,
  language: LanguageDefinition
): Set<string> {
  const localNames = new Set(collectDefinitions(text, language).keys());
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    for (const name of matchParameterNames(line, language)) {
      localNames.add(name);
    }

    for (const name of matchLoopVariableNames(line, language)) {
      localNames.add(name);
    }
  }

  return localNames;
}

function matchParameterNames(
  line: string,
  language: LanguageDefinition
): string[] {
  const signature =
    language.id === 'python'
      ? /^\s*def\s+[A-Za-z_][A-Za-z0-9_]*\s*\(([^)]*)\)/.exec(line)?.[1]
      : /^\s*(?:export\s+)?(?:async\s+)?(?:function\s+)?[A-Za-z_][A-Za-z0-9_]*?\s*\(([^)]*)\)/.exec(line)?.[1];

  if (!signature) {
    return [];
  }

  return signature
    .split(',')
    .map((parameter) => parameter.replace(/=.*$/, '').replace(/:.*$/, '').trim())
    .filter((parameter) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(parameter));
}

function matchLoopVariableNames(
  line: string,
  language: LanguageDefinition
): string[] {
  if (language.id === 'python') {
    const match = /^\s*for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\b/.exec(line);
    return match ? [match[1]] : [];
  }

  const match = /^\s*for\s*\(\s*(?:const|let|var)?\s*([A-Za-z_][A-Za-z0-9_]*)\b/.exec(line);
  return match ? [match[1]] : [];
}

function collectReferencedNames(
  text: string,
  language: LanguageDefinition
): string[] {
  const names = new Set<string>();
  const cleanedText = stripCommentsAndStrings(text, language);
  const identifierPattern = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;
  let match: RegExpExecArray | null;

  while ((match = identifierPattern.exec(cleanedText))) {
    const name = match[0];
    const previousCharacter = cleanedText[match.index - 1];
    const nextSignificant = nextNonWhitespaceCharacter(
      cleanedText,
      match.index + name.length
    );

    if (
      previousCharacter !== '.' &&
      nextSignificant !== '=' &&
      !RESERVED_WORDS.has(name) &&
      !KNOWN_GLOBALS.has(name)
    ) {
      names.add(name);
    }
  }

  return [...names];
}

function collectDefinitions(
  documentText: string,
  language: LanguageDefinition
): Map<string, Definition> {
  const definitions = new Map<string, Definition>();
  const lines = documentText.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    for (const name of matchDefinitionNames(lines[index], language)) {
      if (!definitions.has(name)) {
        definitions.set(name, {
          name,
          text: collectDefinitionBlock(lines, index, language),
          startLine: index
        });
      }
    }
  }

  return definitions;
}

function matchDefinitionNames(
  line: string,
  language: LanguageDefinition
): string[] {
  if (language.id === 'python') {
    return matchPythonDefinitionNames(line);
  }

  return matchBraceLanguageDefinitionNames(line);
}

function matchPythonDefinitionNames(line: string): string[] {
  const names = [
    /^\s*(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)?.[1],
    /^\s*import\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)?.[1],
    /^\s*from\s+[A-Za-z_][A-Za-z0-9_.]*\s+import\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)?.[1]
  ].filter((name): name is string => Boolean(name));
  const assignmentNames = line.match(
    /^\s*([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*=/
  )?.[1];

  if (assignmentNames) {
    names.push(...assignmentNames.split(',').map((name) => name.trim()));
  }

  return names;
}

function matchBraceLanguageDefinitionNames(line: string): string[] {
  const names = [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)?.[1],
    /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1],
    /^\s*(?:public\s+)?(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)?.[1],
    /^\s*(?:func|fn)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(line)?.[1],
    /^\s*#include\s+[<"]([^>"]+)/.exec(line)?.[1]
  ].filter((name): name is string => Boolean(name));

  return names;
}

function collectDefinitionBlock(
  lines: string[],
  startIndex: number,
  language: LanguageDefinition
): string {
  const line = lines[startIndex];

  if (isSingleLineDefinition(line, language)) {
    return line;
  }

  if (language.id === 'python') {
    return collectPythonBlock(lines, startIndex);
  }

  return collectBraceBlock(lines, startIndex);
}

function isSingleLineDefinition(
  line: string,
  language: LanguageDefinition
): boolean {
  if (language.id === 'python') {
    return (
      /^\s*(?:import|from)\s+/.test(line) ||
      /^\s*[A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*\s*=/.test(line)
    );
  }

  return (
    /^\s*#include\s+/.test(line) ||
    /^\s*(?:export\s+)?(?:const|let|var)\s+[A-Za-z_][A-Za-z0-9_]*\s*=.*;?\s*$/.test(line)
  );
}

function collectPythonBlock(lines: string[], startIndex: number): string {
  const startIndent = countIndent(lines[startIndex]);
  let endIndex = startIndex + 1;

  while (endIndex < lines.length) {
    const line = lines[endIndex];
    if (line.trim() && countIndent(line) <= startIndent) {
      break;
    }
    endIndex += 1;
  }

  return lines.slice(startIndex, endIndex).join('\n').trimEnd();
}

function collectBraceBlock(lines: string[], startIndex: number): string {
  let braceDepth = 0;
  let opened = false;
  let endIndex = startIndex;

  for (; endIndex < lines.length; endIndex += 1) {
    const line = lines[endIndex];
    braceDepth += countMatches(line, '{');
    if (braceDepth > 0) {
      opened = true;
    }
    braceDepth -= countMatches(line, '}');

    if (opened && braceDepth <= 0) {
      break;
    }
  }

  return lines.slice(startIndex, endIndex + 1).join('\n').trimEnd();
}

function stripCommentsAndStrings(
  text: string,
  language: LanguageDefinition
): string {
  const withoutStrings = text
    .replace(/"""[\s\S]*?"""/g, ' ')
    .replace(/'''[\s\S]*?'''/g, ' ')
    .replace(/`(?:\\.|[^`])*`/g, ' ')
    .replace(/"(?:\\.|[^"\\])*"/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, ' ');

  if (language.id === 'python') {
    return withoutStrings.replace(/#.*$/gm, ' ');
  }

  return withoutStrings
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ');
}

function nextNonWhitespaceCharacter(value: string, startIndex: number): string {
  for (let index = startIndex; index < value.length; index += 1) {
    if (!/\s/.test(value[index])) {
      return value[index];
    }
  }

  return '';
}

function countIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length ?? 0;
}

function countMatches(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
