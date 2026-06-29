# Smart Runner

Smart Runner is a Visual Studio Code extension for running selected code snippets with locally installed interpreters and compilers.

## Sprint 1 Status

- Extension skeleton created.
- TypeScript build configured.
- `Smart Runner: Run Selected Snippets` command registered.
- Command activates the extension and confirms execution with a notification.

## Sprint 2 Status

- Active editor lookup added.
- Single and multiple selections are collected in editor order.
- Empty and whitespace-only selections are ignored.
- Exact duplicate ranges are ignored.
- Selected snippets are merged with formatting preserved.

## Sprint 3 Status

- Temporary snippet files are created under the OS temp directory.
- Each run gets a unique temporary workspace.
- The detected language extension is preserved.
- Temporary files are cleaned up automatically after preparation.

## Sprint 4 Status

- Current editor language is detected from VS Code's `languageId`.
- Python, JavaScript, and TypeScript are supported.
- Unsupported languages show a clear warning.
- A language registry is in place for future C, C++, Java, Go, and Rust support.

## Sprint 5 Status

- Execution commands are built for Python, JavaScript, and TypeScript.
- Snippets run from generated temporary files.
- Standard output, standard error, and exit codes are captured.
- Results can be captured by the lower-level execution engine for future testing and diagnostics.

Current commands:

- Python: `python temp.py`
- JavaScript: `node temp.js`
- TypeScript: `tsx temp.ts`

## Sprint 6 Status

- Snippets run in a reusable integrated VS Code terminal.
- The terminal is focused when a snippet is sent.
- Running and submitted notifications are shown.

## Sprint 7 Status

- Command Palette entry: `Smart Runner: Run Selected Snippets`.
- Editor title run button and editor run-dropdown entry.
- Editor context menu entry for selected code.
- Default keybinding: `Ctrl+Shift+R` on Windows/Linux and `Cmd+Shift+R` on macOS.

## Sprint 8 Status

- Compiled-language command support added for C, C++, Java, Go, and Rust.
- C, C++, and Rust compile to a temporary executable and then run it.
- Java compiles with `javac` and runs `Main` from the temporary directory.
- Go uses `go run`.

Current compiled commands:

- C: `gcc temp.c -o snippet && snippet`
- C++: `g++ temp.cpp -o snippet && snippet`
- Java: `javac Main.java && java -cp temp-dir Main`
- Go: `go run temp.go`
- Rust: `rustc temp.rs -o snippet && snippet`

## Sprint 9 Status

- VS Code settings added for interpreter and compiler paths.
- Temporary directory, terminal reuse, compiler arguments, timeout, environment variables, and working directory settings are available.
- Interpreter/compiler paths and compiler arguments are used by the command builder.
- Terminal reuse and temporary directory settings are wired into runtime behavior.

## Sprint 10 Status

- A same-file dependency resolver is in place.
- Referenced variables, imports, functions, and class definitions are prepended when obvious matches are found.
- The resolver supports Python, JavaScript, TypeScript, C, C++, Java, Go, and Rust with lightweight heuristics.
- Smart Runner warns before running when referenced dependencies cannot be found in the current file.
- Example: selecting `print(x + y)` in Python also includes earlier `x = ...` and `y = ...` assignments.

## Sprint 11 Status

- If no code is selected, Smart Runner attempts to run the current function or class around the cursor.
- Python indentation blocks and brace-based language blocks are supported with lightweight detection.

## Sprint 12 Status

- Recent executions are persisted in VS Code global state.
- `Smart Runner: Rerun Last Snippet` reruns the latest item.
- `Smart Runner: Show Execution History` opens a Quick Pick list of recent snippets.
- History is capped at 50 items.

## Sprint 13 Status

- Unit test infrastructure added with Node's built-in test runner.
- Execution command builder tests cover interpreted and compiled-language commands.
- Temporary file creation and cleanup are covered.

## Sprint 15 Status

- Bring-your-own-key AI integration added.
- Providers: Gemini, OpenAI, Anthropic, Groq, OpenRouter, Ollama, and LM Studio.
- API keys are stored with VS Code Secret Storage, not in settings or project files.
- Local providers Ollama and LM Studio do not require API keys.
- AI commands added for explaining code, explaining algorithms, time/space complexity, optimizing, generating tests, generating docs, refactoring, fixing code, and explaining pasted errors.
- AI output is written to the `Smart Runner AI` output channel.
- CodeLens buttons appear above selected code blocks for run, explain, fix, explain-error, and optimize actions.
- Status-bar `Run Selection`, `Explain Selection`, and `Explain Error` buttons appear while code is selected.
- AI quick fixes appear in the lightbulb menu when VS Code diagnostics are available.
- `Smart Runner AI: Help` opens an in-editor guide for setup, selected-code actions, and error actions.

### AI Setup

Choose a provider:

```text
Smart Runner: Choose AI Provider
```

Open AI help:

```text
Smart Runner AI: Help
```

Store or update a key for remote providers:

```text
Smart Runner: Add or Update AI API Key
```

Test the connection:

```text
Smart Runner: Test AI Connection
```

Remove a stored key:

```text
Smart Runner: Remove AI API Key
```

### AI Security Model

- API keys are stored only in VS Code Secret Storage.
- API keys are never written to `settings.json`, `package.json`, temporary files, or project files.
- API keys are only sent to the selected provider.
- Error messages are redacted before being shown.
- Local providers can be used with no API key.

### AI Editor Shortcuts

Select code and use the CodeLens above the selection:

```text
Run Selection | Explain Selection | Fix | Explain Error | Optimize
```

Or use the status bar:

```text
Run Selection
Explain Selection
Explain Error
```

When VS Code shows an error lightbulb, open it and choose:

```text
Smart Runner AI: Fix Code
Smart Runner AI: Explain Error
```

If those buttons do not appear, make sure VS Code's `editor.codeLens` setting and Smart Runner's `smartRunner.ai.selectionCodeLens` setting are both enabled.

## Development

Install dependencies:

```bash
npm install
```

Compile:

```bash
npm run compile
```

Run tests:

```bash
npm test
```

Build a VSIX:

```bash
npm run package
```

Launch the extension from VS Code with the Extension Development Host.

## FAQ

**Does Smart Runner install compilers or interpreters?**
No. It uses tools already available on your machine, such as `python`, `node`, `gcc`, `javac`, `go`, or `rustc`.

**Can I customize tool paths?**
Yes. Use the `smartRunner.*Path` settings in VS Code.

**Does dependency resolution use a full AST?**
Not yet. Sprint 10 uses same-file heuristics for variables, imports, functions, and classes, and warns when names are unresolved. AST-based dependency resolution remains a future hardening task.

## Known Issues

- TypeScript snippets require `tsx` to be installed or configured.
- Java snippets are run as `Main`, so selected Java code should fit that entry-point model.
- Terminal execution keeps temporary files by default so commands can run reliably after being sent to the terminal.

## Marketplace Release Checklist

- Update `publisher` in `package.json`.
- Replace the placeholder repository URL.
- Add screenshots or GIF demonstrations.
- Run `npm test`.
- Run `npm run package`.
- Publish the generated VSIX with a verified publisher account.

## Roadmap

The project is being built sprint by sprint from the Agile Development Roadmap:

1. Project Foundation
2. Selection Engine
3. Temporary File Manager
4. Language Detection
5. Execution Engine
6. Terminal Integration
7. User Experience
8. Multi-Language Support
9. Configuration System
10. Smart Dependency Resolver
11. Execute Current Function
12. Execution History
13. Testing
14. Marketplace Release
15. AI Integration

## Future Roadmap

- AST-backed dependency resolution.
- Debugger integration.
- Rich execution diagnostics.
- Shareable snippets and synchronized history.
