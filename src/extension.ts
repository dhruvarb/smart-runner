import * as vscode from 'vscode';
import { collectSelectedSnippets } from './selectionEngine';
import { createTemporarySnippetFile } from './tempFileManager';
import {
  detectLanguage,
  getLanguageById,
  getSupportedLanguageNames,
  type LanguageDefinition
} from './languageRegistry';
import { buildExecutionCommand } from './executionEngine';
import { TerminalRunner } from './terminalRunner';
import { getSmartRunnerConfiguration } from './configuration';
import { resolveDependencies, type DependencyResolutionResult } from './dependencyResolver';
import { collectCurrentFunctionSnippet } from './currentFunction';
import { ExecutionHistory, type ExecutionHistoryItem } from './executionHistory';
import { registerAiCommands } from './aiCommands';
import { AiSelectionCodeLensProvider } from './aiSelectionCodeLens';
import { AiErrorCodeActionProvider } from './aiErrorCodeActions';
import { AiSelectionStatusBar } from './aiStatusBar';

const RUN_SELECTED_SNIPPETS_COMMAND = 'smartRunner.runSelectedSnippets';
const RERUN_LAST_SNIPPET_COMMAND = 'smartRunner.rerunLastSnippet';
const SHOW_EXECUTION_HISTORY_COMMAND = 'smartRunner.showExecutionHistory';

export function activate(context: vscode.ExtensionContext): void {
  const terminalRunner = new TerminalRunner();
  const executionHistory = new ExecutionHistory(context.globalState);
  const aiSelectionCodeLensProvider = new AiSelectionCodeLensProvider();
  const aiSelectionStatusBar = new AiSelectionStatusBar();
  const runSelectedSnippets = vscode.commands.registerCommand(
    RUN_SELECTED_SNIPPETS_COMMAND,
    async () => {
      const editor = vscode.window.activeTextEditor;
      const selectionResult = collectSelectedSnippets(editor);
      const language = detectLanguage(editor?.document);

      if (selectionResult.snippets.length === 0 && editor && language) {
        const currentFunction = collectCurrentFunctionSnippet(editor, language);
        if (currentFunction) {
          selectionResult.snippets.push(currentFunction);
          selectionResult.mergedText = currentFunction.text;
        }
      }

      if (selectionResult.snippets.length === 0) {
        void vscode.window.showWarningMessage(
          'Smart Runner: select code or place the cursor inside a function to run.'
        );
        return;
      }

      if (!language) {
        void vscode.window.showWarningMessage(
          `Smart Runner supports ${getSupportedLanguageNames()} in this sprint.`
        );
        return;
      }

      try {
        void vscode.window.showInformationMessage('Smart Runner: running selected snippets...');
        const dependencyResult = editor
          ? resolveDependencies(editor.document, language, selectionResult.mergedText)
          : createDependencyResult(selectionResult.mergedText);

        if (dependencyResult.unresolvedDependencies.length > 0) {
          void vscode.window.showWarningMessage(
            `Smart Runner could not find dependencies: ${dependencyResult.unresolvedDependencies.join(', ')}`
          );
        }

        const runnableText = dependencyResult.runnableText;
        await runSnippetText(language, runnableText, terminalRunner);
        await executionHistory.add(language, runnableText);
        void vscode.window.showInformationMessage('Smart Runner sent the snippet to the terminal.');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(
          `Smart Runner could not prepare the selected snippets: ${message}`
        );
      }
    }
  );
  const rerunLastSnippet = vscode.commands.registerCommand(
    RERUN_LAST_SNIPPET_COMMAND,
    async () => {
      const item = executionHistory.getLast();
      await runHistoryItem(item, terminalRunner);
    }
  );
  const showExecutionHistory = vscode.commands.registerCommand(
    SHOW_EXECUTION_HISTORY_COMMAND,
    async () => {
      const item = await pickHistoryItem(executionHistory.getAll());
      await runHistoryItem(item, terminalRunner);
    }
  );

  context.subscriptions.push(
    terminalRunner,
    aiSelectionCodeLensProvider,
    aiSelectionStatusBar,
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file' },
      aiSelectionCodeLensProvider
    ),
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file' },
      new AiErrorCodeActionProvider(),
      {
        providedCodeActionKinds: AiErrorCodeActionProvider.providedCodeActionKinds
      }
    ),
    runSelectedSnippets,
    rerunLastSnippet,
    showExecutionHistory,
    ...registerAiCommands(context)
  );
}

export function deactivate(): void {
  // VS Code disposes registered commands through context subscriptions.
}

function createDependencyResult(snippetText: string): DependencyResolutionResult {
  return {
    runnableText: snippetText,
    includedDependencies: [],
    unresolvedDependencies: []
  };
}

async function runSnippetText(
  language: LanguageDefinition,
  snippetText: string,
  terminalRunner: TerminalRunner
): Promise<void> {
  const config = getSmartRunnerConfiguration();
  const tempFile = await createTemporarySnippetFile(
    snippetText,
    language.tempFileName,
    config.temporaryDirectory
  );
  const executionCommand = buildExecutionCommand(language, tempFile.filePath, config);
  terminalRunner.run(executionCommand, config.reuseTerminal);
}

async function runHistoryItem(
  item: ExecutionHistoryItem | undefined,
  terminalRunner: TerminalRunner
): Promise<void> {
  if (!item) {
    void vscode.window.showWarningMessage('Smart Runner history is empty.');
    return;
  }

  const language = getLanguageById(item.languageId);
  if (!language) {
    void vscode.window.showWarningMessage(
      `Smart Runner no longer supports ${item.languageName}.`
    );
    return;
  }

  await runSnippetText(language, item.snippetText, terminalRunner);
}

async function pickHistoryItem(
  items: ExecutionHistoryItem[]
): Promise<ExecutionHistoryItem | undefined> {
  if (items.length === 0) {
    void vscode.window.showWarningMessage('Smart Runner history is empty.');
    return undefined;
  }

  const picked = await vscode.window.showQuickPick(
    items.map((item) => ({
      label: item.languageName,
      description: new Date(item.createdAt).toLocaleString(),
      detail: item.snippetText.split(/\r?\n/).find(Boolean) ?? item.snippetText,
      item
    })),
    {
      placeHolder: 'Select a Smart Runner history item'
    }
  );

  return picked?.item;
}
