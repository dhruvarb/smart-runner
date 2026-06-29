import * as vscode from 'vscode';

export interface SnippetSelection {
  range: vscode.Range;
  text: string;
}

export interface SelectionResult {
  snippets: SnippetSelection[];
  mergedText: string;
}

export function collectSelectedSnippets(
  editor: vscode.TextEditor | undefined
): SelectionResult {
  if (!editor) {
    return {
      snippets: [],
      mergedText: ''
    };
  }

  const seenRanges = new Set<string>();
  const snippets: SnippetSelection[] = [];

  for (const selection of editor.selections) {
    if (selection.isEmpty) {
      continue;
    }

    const rangeKey = createRangeKey(selection);
    if (seenRanges.has(rangeKey)) {
      continue;
    }

    seenRanges.add(rangeKey);

    const text = editor.document.getText(selection);
    if (text.trim().length === 0) {
      continue;
    }

    snippets.push({
      range: selection,
      text
    });
  }

  return {
    snippets,
    mergedText: mergeSnippets(snippets)
  };
}

function mergeSnippets(snippets: SnippetSelection[]): string {
  return snippets.map((snippet) => snippet.text).join('\n\n');
}

function createRangeKey(range: vscode.Range): string {
  return [
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character
  ].join(':');
}
