import * as vscode from 'vscode';
import { getAiConfiguration } from './aiConfiguration';
import { AiClient } from './aiClient';
import { AiSecretStorage } from './aiSecretStorage';
import { AI_PROVIDERS, getAiProvider } from './aiProviderRegistry';
import { buildAiPrompt, type AiWorkflow } from './aiPrompts';
import { collectSelectedSnippets } from './selectionEngine';
import { detectLanguage } from './languageRegistry';

const AI_OUTPUT_CHANNEL = 'Smart Runner AI';

export function registerAiCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  const secretStorage = new AiSecretStorage(context.secrets);
  const aiClient = new AiClient();
  const outputChannel = vscode.window.createOutputChannel(AI_OUTPUT_CHANNEL);

  return [
    outputChannel,
    vscode.commands.registerCommand('smartRunner.ai.showHelp', () => showAiHelp()),
    vscode.commands.registerCommand('smartRunner.ai.chooseProvider', () =>
      chooseAiProvider()
    ),
    vscode.commands.registerCommand('smartRunner.ai.addOrUpdateApiKey', () =>
      addOrUpdateApiKey(secretStorage)
    ),
    vscode.commands.registerCommand('smartRunner.ai.removeApiKey', () =>
      removeApiKey(secretStorage)
    ),
    vscode.commands.registerCommand('smartRunner.ai.testConnection', () =>
      testAiConnection(secretStorage, aiClient)
    ),
    vscode.commands.registerCommand('smartRunner.ai.explainCode', () =>
      runSelectedCodeWorkflow('explainCode', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.explainAlgorithm', () =>
      runSelectedCodeWorkflow('explainAlgorithm', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.explainTimeComplexity', () =>
      runSelectedCodeWorkflow('timeComplexity', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.explainSpaceComplexity', () =>
      runSelectedCodeWorkflow('spaceComplexity', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.optimizeCode', () =>
      runSelectedCodeWorkflow('optimizeCode', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.generateTests', () =>
      runSelectedCodeWorkflow('generateTests', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.generateDocumentation', () =>
      runSelectedCodeWorkflow('generateDocumentation', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.refactorCode', () =>
      runSelectedCodeWorkflow('refactorCode', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.fixCode', () =>
      runErrorWorkflow('fixCode', secretStorage, aiClient, outputChannel)
    ),
    vscode.commands.registerCommand('smartRunner.ai.explainError', () =>
      runErrorWorkflow('explainError', secretStorage, aiClient, outputChannel)
    )
  ];
}

function showAiHelp(): void {
  const panel = vscode.window.createWebviewPanel(
    'smartRunnerAiHelp',
    'Smart Runner AI Help',
    vscode.ViewColumn.Beside,
    {}
  );

  panel.webview.html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: var(--vscode-font-family); padding: 24px; line-height: 1.5; }
    h1, h2 { font-weight: 600; }
    code { background: var(--vscode-textCodeBlock-background); padding: 2px 5px; border-radius: 3px; }
    li { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>Smart Runner AI Help</h1>
  <h2>Setup</h2>
  <ol>
    <li>Run <code>Smart Runner: Choose AI Provider</code>.</li>
    <li>For remote providers, run <code>Smart Runner: Add or Update AI API Key</code>.</li>
    <li>Run <code>Smart Runner: Test AI Connection</code>.</li>
  </ol>
  <h2>Selected Code</h2>
  <ul>
    <li>Select code and look above the selection for <code>Explain Selection</code>, <code>Fix</code>, and <code>Optimize</code>.</li>
    <li>Use the status bar button <code>Explain Selection</code> while code is selected.</li>
    <li>Right-click selected code for Smart Runner AI actions.</li>
  </ul>
  <h2>Errors</h2>
  <ul>
    <li>Open the lightbulb on a VS Code diagnostic and choose <code>Smart Runner AI: Fix Code</code> or <code>Smart Runner AI: Explain Error</code>.</li>
    <li>If the error came from terminal output, select the failing code and run <code>Smart Runner AI: Explain Error</code>, then paste the error text.</li>
  </ul>
  <h2>If Buttons Do Not Appear</h2>
  <ul>
    <li>Make sure VS Code setting <code>editor.codeLens</code> is enabled.</li>
    <li>Make sure <code>smartRunner.ai.selectionCodeLens</code> is enabled.</li>
    <li>Restart the Extension Development Host after changing extension code.</li>
  </ul>
</body>
</html>`;
}

async function chooseAiProvider(): Promise<void> {
  const picked = await vscode.window.showQuickPick(
    AI_PROVIDERS.map((provider) => ({
      label: provider.displayName,
      description: provider.requiresApiKey ? 'API key required' : 'Local provider',
      detail: `Default model: ${provider.defaultModel}`,
      provider
    })),
    {
      placeHolder: 'Choose an AI provider for Smart Runner'
    }
  );

  if (!picked) {
    return;
  }

  await vscode.workspace
    .getConfiguration('smartRunner.ai')
    .update('provider', picked.provider.id, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration('smartRunner.ai')
    .update('model', picked.provider.defaultModel, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration('smartRunner.ai')
    .update('baseUrl', picked.provider.defaultBaseUrl, vscode.ConfigurationTarget.Global);
  void vscode.window.showInformationMessage(
    `Smart Runner AI provider set to ${picked.provider.displayName}.`
  );
}

async function addOrUpdateApiKey(secretStorage: AiSecretStorage): Promise<void> {
  const config = getAiConfiguration();

  if (!config.provider.requiresApiKey) {
    void vscode.window.showInformationMessage(
      `${config.provider.displayName} does not require an API key.`
    );
    return;
  }

  const apiKey = await vscode.window.showInputBox({
    title: `Smart Runner: ${config.provider.displayName} API Key`,
    prompt: 'Enter your API key. It will be stored in VS Code Secret Storage.',
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => (value.trim() ? undefined : 'API key is required.')
  });

  if (!apiKey) {
    return;
  }

  await secretStorage.storeApiKey(config.provider, apiKey.trim());
  void vscode.window.showInformationMessage(
    `Smart Runner stored the ${config.provider.displayName} API key securely.`
  );
}

async function removeApiKey(secretStorage: AiSecretStorage): Promise<void> {
  const config = getAiConfiguration();

  await secretStorage.deleteApiKey(config.provider);
  void vscode.window.showInformationMessage(
    `Smart Runner removed the ${config.provider.displayName} API key.`
  );
}

async function testAiConnection(
  secretStorage: AiSecretStorage,
  aiClient: AiClient
): Promise<void> {
  const config = getAiConfiguration();
  const apiKey = await secretStorage.getApiKey(config.provider);

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Testing ${config.provider.displayName} connection...`,
        cancellable: false
      },
      () =>
        aiClient.send(config, apiKey, {
          systemPrompt: 'Reply with exactly: Smart Runner OK',
          userPrompt: 'Test the Smart Runner AI connection.'
        })
    );
    void vscode.window.showInformationMessage(
      `Smart Runner connected to ${config.provider.displayName}.`
    );
  } catch (error) {
    showAiError(error);
  }
}

async function runSelectedCodeWorkflow(
  workflow: AiWorkflow,
  secretStorage: AiSecretStorage,
  aiClient: AiClient,
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const code = collectSelectedSnippets(editor).mergedText;

  if (!editor || !code.trim()) {
    void vscode.window.showWarningMessage('Smart Runner AI: select code first.');
    return;
  }

  const language = detectLanguage(editor.document);
  await runAiWorkflow(
    workflow,
    code,
    language?.displayName ?? editor.document.languageId,
    secretStorage,
    aiClient,
    outputChannel
  );
}

async function runErrorWorkflow(
  workflow: Extract<AiWorkflow, 'fixCode' | 'explainError'>,
  secretStorage: AiSecretStorage,
  aiClient: AiClient,
  outputChannel: vscode.OutputChannel
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const code = collectSelectedSnippets(editor).mergedText;

  if (!editor || !code.trim()) {
    void vscode.window.showWarningMessage('Smart Runner AI: select the failing code first.');
    return;
  }

  const errorMessage = await vscode.window.showInputBox({
    title: workflow === 'fixCode' ? 'Smart Runner: Fix Code' : 'Smart Runner: Explain Error',
    prompt: 'Paste the main error message.',
    ignoreFocusOut: true
  });

  if (errorMessage === undefined) {
    return;
  }

  const runtimeOutput = await vscode.window.showInputBox({
    title: 'Smart Runner: Compiler or Runtime Output',
    prompt: 'Optionally paste compiler/runtime output.',
    ignoreFocusOut: true
  });

  const language = detectLanguage(editor.document);
  await runAiWorkflow(
    workflow,
    code,
    language?.displayName ?? editor.document.languageId,
    secretStorage,
    aiClient,
    outputChannel,
    errorMessage,
    runtimeOutput
  );
}

async function runAiWorkflow(
  workflow: AiWorkflow,
  code: string,
  languageName: string,
  secretStorage: AiSecretStorage,
  aiClient: AiClient,
  outputChannel: vscode.OutputChannel,
  errorMessage?: string,
  runtimeOutput?: string
): Promise<void> {
  const config = getAiConfiguration();
  const apiKey = await secretStorage.getApiKey(config.provider);
  const prompt = buildAiPrompt({
    workflow,
    code,
    languageName,
    errorMessage,
    runtimeOutput
  });

  try {
    const response = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Smart Runner AI: ${workflowLabel(workflow)} with ${config.provider.displayName}...`,
        cancellable: false
      },
      () => aiClient.send(config, apiKey, prompt)
    );

    outputChannel.clear();
    outputChannel.appendLine(`# ${workflowLabel(workflow)}`);
    outputChannel.appendLine('');
    outputChannel.appendLine(`Provider: ${config.provider.displayName}`);
    outputChannel.appendLine(`Model: ${config.model}`);
    outputChannel.appendLine('');
    outputChannel.appendLine(response.text);
    outputChannel.show(true);
  } catch (error) {
    showAiError(error);
  }
}

function workflowLabel(workflow: AiWorkflow): string {
  switch (workflow) {
    case 'explainCode':
      return 'Explain Code';
    case 'explainAlgorithm':
      return 'Explain Algorithm';
    case 'timeComplexity':
      return 'Explain Time Complexity';
    case 'spaceComplexity':
      return 'Explain Space Complexity';
    case 'optimizeCode':
      return 'Optimize Code';
    case 'generateTests':
      return 'Generate Test Cases';
    case 'generateDocumentation':
      return 'Generate Documentation';
    case 'refactorCode':
      return 'Refactor Code';
    case 'fixCode':
      return 'Fix Code';
    case 'explainError':
      return 'Explain Error';
  }
}

function showAiError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  void vscode.window.showErrorMessage(`Smart Runner AI: ${redactSecrets(message)}`);
}

function redactSecrets(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/api[_-]?key[=:]\s*[A-Za-z0-9._~+/=-]+/gi, 'api_key=[redacted]');
}
