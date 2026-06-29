export type AiWorkflow =
  | 'explainCode'
  | 'explainAlgorithm'
  | 'timeComplexity'
  | 'spaceComplexity'
  | 'optimizeCode'
  | 'generateTests'
  | 'generateDocumentation'
  | 'refactorCode'
  | 'fixCode'
  | 'explainError';

export interface AiPromptContext {
  workflow: AiWorkflow;
  code: string;
  languageName: string;
  errorMessage?: string;
  runtimeOutput?: string;
}

export function buildAiPrompt(context: AiPromptContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt:
      'You are Smart Runner AI, a careful coding assistant inside VS Code. Do not invent APIs. Keep answers actionable, concise, and code-focused.',
    userPrompt: buildUserPrompt(context)
  };
}

function buildUserPrompt(context: AiPromptContext): string {
  const codeBlock = fencedCode(context.languageName, context.code);

  switch (context.workflow) {
    case 'explainCode':
      return `Explain what this ${context.languageName} code does.\n\n${codeBlock}`;
    case 'explainAlgorithm':
      return `Explain the algorithm used by this ${context.languageName} code. Include the main idea and important steps.\n\n${codeBlock}`;
    case 'timeComplexity':
      return `Analyze the time complexity of this ${context.languageName} code. State assumptions clearly.\n\n${codeBlock}`;
    case 'spaceComplexity':
      return `Analyze the space complexity of this ${context.languageName} code. State assumptions clearly.\n\n${codeBlock}`;
    case 'optimizeCode':
      return `Optimize this ${context.languageName} code for performance, readability, and memory usage. Return an explanation and improved code.\n\n${codeBlock}`;
    case 'generateTests':
      return `Generate edge cases, unit tests, sample inputs, and sample outputs for this ${context.languageName} code.\n\n${codeBlock}`;
    case 'generateDocumentation':
      return `Generate function documentation, useful inline-comment suggestions, README snippets, and API documentation for this ${context.languageName} code.\n\n${codeBlock}`;
    case 'refactorCode':
      return `Refactor this ${context.languageName} code. Improve structure, naming, duplication, and readability. Return an explanation and refactored code.\n\n${codeBlock}`;
    case 'fixCode':
      return `Fix this ${context.languageName} code. Return: Explanation, Corrected Code, and Reasoning for the fix.\n\nError message:\n${context.errorMessage ?? 'No error message provided.'}\n\nRuntime/compiler output:\n${context.runtimeOutput ?? 'No output provided.'}\n\n${codeBlock}`;
    case 'explainError':
      return `Explain this ${context.languageName} execution error and suggest next steps.\n\nError message:\n${context.errorMessage ?? 'No error message provided.'}\n\nRuntime/compiler output:\n${context.runtimeOutput ?? 'No output provided.'}\n\nSelected code:\n${codeBlock}`;
  }
}

function fencedCode(languageName: string, code: string): string {
  return `\`\`\`${languageName.toLowerCase()}\n${code}\n\`\`\``;
}
