import * as vscode from 'vscode';
import { formatCommandLine, type ExecutionCommand } from './executionEngine';

const TERMINAL_NAME = 'Smart Runner';

export class TerminalRunner implements vscode.Disposable {
  private terminal: vscode.Terminal | undefined;

  run(executionCommand: ExecutionCommand, reuseTerminal: boolean): void {
    const terminal = this.getTerminal(reuseTerminal);
    terminal.show(true);
    terminal.sendText(formatCommandLine(executionCommand), true);
  }

  dispose(): void {
    this.terminal?.dispose();
    this.terminal = undefined;
  }

  private getTerminal(reuseTerminal: boolean): vscode.Terminal {
    if (!reuseTerminal) {
      return vscode.window.createTerminal(TERMINAL_NAME);
    }

    if (!this.terminal || this.terminal.exitStatus) {
      this.terminal = vscode.window.createTerminal(TERMINAL_NAME);
    }

    return this.terminal;
  }
}
