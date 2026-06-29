import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExecutionCommand } from '../src/executionEngine';
import type { SmartRunnerConfiguration } from '../src/configuration';
import type { LanguageDefinition } from '../src/languageRegistry';

const baseConfig: SmartRunnerConfiguration = {
  pythonPath: 'python3',
  nodePath: 'node',
  tsxPath: 'tsx',
  javaPath: 'java',
  javacPath: 'javac',
  cCompilerPath: 'gcc',
  cppCompilerPath: 'g++',
  rustCompilerPath: 'rustc',
  goPath: 'go',
  temporaryDirectory: '',
  deleteTemporaryFiles: false,
  reuseTerminal: true,
  compilerArguments: ['-O2'],
  timeout: 0,
  environmentVariables: {},
  workingDirectory: ''
};

test('builds Python execution command with configured interpreter', () => {
  const language = languageDefinition('python', 'Python', '.py', 'snippet.py');
  const command = buildExecutionCommand(language, 'C:/tmp/snippet.py', baseConfig);

  assert.equal(command.commandLine, 'python3 "C:/tmp/snippet.py"');
});

test('quotes Windows backslash paths for Git Bash terminals', () => {
  const language = languageDefinition('python', 'Python', '.py', 'snippet.py');
  const command = buildExecutionCommand(
    language,
    'C:\\Users\\DHRUVA~1\\AppData\\Local\\Temp\\smart-runner\\run\\snippet.py',
    baseConfig
  );

  assert.equal(
    command.commandLine,
    'python3 "C:\\Users\\DHRUVA~1\\AppData\\Local\\Temp\\smart-runner\\run\\snippet.py"'
  );
});

test('builds C++ compile and run command with compiler arguments', () => {
  const language = languageDefinition('cpp', 'C++', '.cpp', 'snippet.cpp');
  const command = buildExecutionCommand(language, 'C:/tmp/snippet.cpp', baseConfig);

  assert.match(command.commandLine, /^g\+\+ "C:\/tmp\/snippet\.cpp" -O2 -o /);
  assert.match(command.commandLine, /&&/);
});

test('builds Java command that compiles and runs Main', () => {
  const language = languageDefinition('java', 'Java', '.java', 'Main.java');
  const command = buildExecutionCommand(language, 'C:/tmp/Main.java', baseConfig);

  assert.equal(command.commandLine, 'javac "C:/tmp/Main.java" -O2 && java -cp "C:/tmp" Main');
});

function languageDefinition(
  id: string,
  displayName: string,
  fileExtension: string,
  tempFileName: string
): LanguageDefinition {
  return {
    id,
    displayName,
    fileExtension,
    tempFileName
  };
}
