import * as vscode from 'vscode';

export class AiSelectionCodeLensProvider
  implements vscode.CodeLensProvider, vscode.Disposable
{
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this.changeEmitter.event;
  private readonly selectionListener: vscode.Disposable;

  constructor() {
    this.selectionListener = vscode.window.onDidChangeTextEditorSelection(() => {
      this.changeEmitter.fire();
    });
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const enabled = vscode.workspace
      .getConfiguration('smartRunner.ai')
      .get('selectionCodeLens', true);
    if (!enabled) {
      return [];
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
      return [];
    }

    return editor.selections
      .filter((selection) => !selection.isEmpty)
      .flatMap((selection) => createSelectionCodeLenses(selection));
  }

  dispose(): void {
    this.selectionListener.dispose();
    this.changeEmitter.dispose();
  }
}

function createSelectionCodeLenses(selection: vscode.Selection): vscode.CodeLens[] {
  const range = new vscode.Range(selection.start, selection.start);

  return [
    new vscode.CodeLens(range, {
      title: '$(play) Run Selection',
      command: 'smartRunner.runSelectedSnippets'
    }),
    new vscode.CodeLens(range, {
      title: '$(sparkle) Explain Selection',
      command: 'smartRunner.ai.explainCode'
    }),
    new vscode.CodeLens(range, {
      title: '$(tools) Fix',
      command: 'smartRunner.ai.fixCode'
    }),
    new vscode.CodeLens(range, {
      title: '$(warning) Explain Error',
      command: 'smartRunner.ai.explainError'
    }),
    new vscode.CodeLens(range, {
      title: '$(rocket) Optimize',
      command: 'smartRunner.ai.optimizeCode'
    })
  ];
}
