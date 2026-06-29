# Smart Runner Setup Guide

This guide explains how to install, run, test, and package the Smart Runner VS Code extension.

## Prerequisites

- Visual Studio Code
- Node.js 22 or newer
- npm
- Local runtimes or compilers for the languages you want to run:
  - Python: `python`
  - JavaScript: `node`
  - TypeScript: `tsx`
  - C: `gcc`
  - C++: `g++`
  - Java: `javac` and `java`
  - Go: `go`
  - Rust: `rustc`

## Install Dependencies

```bash
npm install
```

## Run in Development

1. Open this project folder in VS Code.
2. Press `F5`.
3. VS Code opens a new Extension Development Host window.
4. Open a code file in that new window.
5. Select a block of code.
6. Click `Run Selection` above the block or run `Smart Runner: Run Selected Snippets`.

## Common Commands

```bash
npm run compile
npm test
npm run package
```

## Running Selected Code

Smart Runner can run selected snippets from:

- CodeLens above the selected block: `Run Selection`
- Status bar: `Run Selection`
- Command Palette: `Smart Runner: Run Selected Snippets`
- Shortcut: `Ctrl+Shift+R`
- Editor run dropdown: `Smart Runner: Run Selected Snippets`

## Dependency Inclusion

Smart Runner automatically includes obvious same-file dependencies before running a selected snippet, including:

- Variables
- Imports
- Functions
- Classes

Example:

```python
x = 10
y = 20

print(x + y)
```

If you select only `print(x + y)`, Smart Runner creates a temporary runnable file containing `x`, `y`, and the selected line.

If a dependency cannot be found, Smart Runner shows a warning before running.

## AI Setup

1. Run `Smart Runner: Choose AI Provider`.
2. Pick Gemini, OpenAI, Anthropic, Groq, OpenRouter, Ollama, or LM Studio.
3. For remote providers, run `Smart Runner: Add or Update AI API Key`.
4. Run `Smart Runner: Test AI Connection`.

API keys are stored with VS Code Secret Storage and are not written to project files or settings.

## AI Actions

After selecting code, use:

- `Explain Selection`
- `Fix`
- `Explain Error`
- `Optimize`

These appear above the selection and in the status bar. You can also access all AI commands from the Command Palette by searching `Smart Runner AI`.

## Package a VSIX

```bash
npm run package
```

This creates `smart-runner-0.0.1.vsix` in the project root.

## Install the VSIX

1. Open VS Code.
2. Run `Extensions: Install from VSIX...`.
3. Select `smart-runner-0.0.1.vsix`.
4. Reload VS Code.

## Troubleshooting

- If CodeLens buttons do not appear, enable `editor.codeLens` and `smartRunner.ai.selectionCodeLens`.
- If TypeScript snippets fail, install or configure `tsx`.
- If Python paths fail in Git Bash, make sure you are using the latest packaged version. Smart Runner quotes Windows paths for Git Bash.
- If AI commands fail, run `Smart Runner: Test AI Connection`.
