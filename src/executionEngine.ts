import { spawn } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import type { SmartRunnerConfiguration } from './configuration';
import type { LanguageDefinition } from './languageRegistry';

export interface ExecutionCommand {
  commandLine: string;
}

export interface ExecutionResult {
  commandLine: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export function buildExecutionCommand(
  language: LanguageDefinition,
  filePath: string,
  config: SmartRunnerConfiguration
): ExecutionCommand {
  const directoryPath = path.dirname(filePath);
  const binaryPath = path.join(
    directoryPath,
    os.platform() === 'win32' ? 'snippet.exe' : 'snippet'
  );

  switch (language.id) {
    case 'python':
      return {
        commandLine: `${quoteIfNeeded(config.pythonPath)} ${quoteIfNeeded(filePath)}`
      };
    case 'javascript':
      return {
        commandLine: `${quoteIfNeeded(config.nodePath)} ${quoteIfNeeded(filePath)}`
      };
    case 'typescript':
      return {
        commandLine: `${quoteIfNeeded(config.tsxPath)} ${quoteIfNeeded(filePath)}`
      };
    case 'c':
      return {
        commandLine: `${quoteIfNeeded(config.cCompilerPath)} ${quoteIfNeeded(filePath)} ${formatCompilerArguments(config.compilerArguments)} -o ${quoteIfNeeded(binaryPath)} && ${quoteIfNeeded(binaryPath)}`
      };
    case 'cpp':
      return {
        commandLine: `${quoteIfNeeded(config.cppCompilerPath)} ${quoteIfNeeded(filePath)} ${formatCompilerArguments(config.compilerArguments)} -o ${quoteIfNeeded(binaryPath)} && ${quoteIfNeeded(binaryPath)}`
      };
    case 'java':
      return {
        commandLine: `${quoteIfNeeded(config.javacPath)} ${quoteIfNeeded(filePath)} ${formatCompilerArguments(config.compilerArguments)} && ${quoteIfNeeded(config.javaPath)} -cp ${quoteIfNeeded(directoryPath)} Main`
      };
    case 'go':
      return {
        commandLine: `${quoteIfNeeded(config.goPath)} run ${quoteIfNeeded(filePath)}`
      };
    case 'rust':
      return {
        commandLine: `${quoteIfNeeded(config.rustCompilerPath)} ${quoteIfNeeded(filePath)} ${formatCompilerArguments(config.compilerArguments)} -o ${quoteIfNeeded(binaryPath)} && ${quoteIfNeeded(binaryPath)}`
      };
    default:
      throw new Error(`Unsupported language: ${language.displayName}`);
  }
}

export function formatCommandLine(executionCommand: ExecutionCommand): string {
  return executionCommand.commandLine;
}

export function executeSnippet(
  executionCommand: ExecutionCommand
): Promise<ExecutionResult> {
  const commandLine = formatCommandLine(executionCommand);

  return new Promise((resolve) => {
    const childProcess = spawn(executionCommand.commandLine, {
      shell: true,
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';
    let processError: string | undefined;

    childProcess.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    childProcess.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    childProcess.on('error', (error) => {
      processError = error.message;
    });

    childProcess.on('close', (exitCode) => {
      resolve({
        commandLine,
        exitCode,
        stdout,
        stderr,
        error: processError
      });
    });
  });
}

function quoteIfNeeded(value: string): string {
  return shouldQuote(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

function shouldQuote(value: string): boolean {
  return /\s/.test(value) || /[A-Za-z]:[\\/]/.test(value) || value.includes('\\');
}

function formatCompilerArguments(args: string[]): string {
  return args.map(quoteIfNeeded).join(' ');
}
