import * as vscode from 'vscode';

export class AiErrorCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    if (context.diagnostics.length === 0) {
      return [];
    }

    const explainError = new vscode.CodeAction(
      'Smart Runner AI: Explain Error',
      vscode.CodeActionKind.QuickFix
    );
    explainError.command = {
      title: 'Smart Runner AI: Explain Error',
      command: 'smartRunner.ai.explainError'
    };
    explainError.diagnostics = [...context.diagnostics];

    const fixCode = new vscode.CodeAction(
      'Smart Runner AI: Fix Code',
      vscode.CodeActionKind.QuickFix
    );
    fixCode.command = {
      title: 'Smart Runner AI: Fix Code',
      command: 'smartRunner.ai.fixCode'
    };
    fixCode.diagnostics = [...context.diagnostics];
    fixCode.isPreferred = true;

    return [fixCode, explainError];
  }
}
