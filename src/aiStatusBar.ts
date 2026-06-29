import * as vscode from 'vscode';

export class AiSelectionStatusBar implements vscode.Disposable {
  private readonly runItem: vscode.StatusBarItem;
  private readonly explainItem: vscode.StatusBarItem;
  private readonly explainErrorItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[];

  constructor() {
    this.runItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      91
    );
    this.runItem.command = 'smartRunner.runSelectedSnippets';
    this.runItem.text = '$(play) Run Selection';
    this.runItem.tooltip = 'Smart Runner: run the selected code';

    this.explainItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      90
    );
    this.explainItem.command = 'smartRunner.ai.explainCode';
    this.explainItem.text = '$(sparkle) Explain Selection';
    this.explainItem.tooltip = 'Smart Runner AI: explain the selected code';

    this.explainErrorItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      89
    );
    this.explainErrorItem.command = 'smartRunner.ai.explainError';
    this.explainErrorItem.text = '$(warning) Explain Error';
    this.explainErrorItem.tooltip = 'Smart Runner AI: explain an error for the selected code';
    this.disposables = [
      this.runItem,
      this.explainItem,
      this.explainErrorItem,
      vscode.window.onDidChangeActiveTextEditor(() => this.update()),
      vscode.window.onDidChangeTextEditorSelection(() => this.update())
    ];
    this.update();
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  private update(): void {
    const editor = vscode.window.activeTextEditor;
    const hasSelection =
      Boolean(editor) && editor!.selections.some((selection) => !selection.isEmpty);

    if (hasSelection) {
      this.runItem.show();
      this.explainItem.show();
      this.explainErrorItem.show();
    } else {
      this.runItem.hide();
      this.explainItem.hide();
      this.explainErrorItem.hide();
    }
  }
}
