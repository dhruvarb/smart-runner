import * as vscode from 'vscode';

export interface SmartRunnerConfiguration {
  pythonPath: string;
  nodePath: string;
  tsxPath: string;
  javaPath: string;
  javacPath: string;
  cCompilerPath: string;
  cppCompilerPath: string;
  rustCompilerPath: string;
  goPath: string;
  temporaryDirectory: string;
  deleteTemporaryFiles: boolean;
  reuseTerminal: boolean;
  compilerArguments: string[];
  timeout: number;
  environmentVariables: Record<string, string>;
  workingDirectory: string;
}

export function getSmartRunnerConfiguration(): SmartRunnerConfiguration {
  const config = vscode.workspace.getConfiguration('smartRunner');

  return {
    pythonPath: config.get('pythonPath', 'python'),
    nodePath: config.get('nodePath', 'node'),
    tsxPath: config.get('tsxPath', 'tsx'),
    javaPath: config.get('javaPath', 'java'),
    javacPath: config.get('javacPath', 'javac'),
    cCompilerPath: config.get('cCompilerPath', 'gcc'),
    cppCompilerPath: config.get('cppCompilerPath', 'g++'),
    rustCompilerPath: config.get('rustCompilerPath', 'rustc'),
    goPath: config.get('goPath', 'go'),
    temporaryDirectory: config.get('temporaryDirectory', ''),
    deleteTemporaryFiles: config.get('deleteTemporaryFiles', false),
    reuseTerminal: config.get('reuseTerminal', true),
    compilerArguments: config.get('compilerArguments', []),
    timeout: config.get('timeout', 0),
    environmentVariables: config.get('environmentVariables', {}),
    workingDirectory: config.get('workingDirectory', '')
  };
}
