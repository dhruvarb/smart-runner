import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAiPrompt } from '../src/aiPrompts';

test('builds fix-code prompt with code and error output', () => {
  const prompt = buildAiPrompt({
    workflow: 'fixCode',
    code: 'print(square(2))',
    languageName: 'Python',
    errorMessage: 'NameError: square is not defined',
    runtimeOutput: 'Traceback...'
  });

  assert.match(prompt.systemPrompt, /Smart Runner AI/);
  assert.match(prompt.userPrompt, /Corrected Code/);
  assert.match(prompt.userPrompt, /NameError/);
  assert.match(prompt.userPrompt, /```python/);
});

test('builds complexity prompt for selected code', () => {
  const prompt = buildAiPrompt({
    workflow: 'timeComplexity',
    code: 'for (const item of items) console.log(item);',
    languageName: 'JavaScript'
  });

  assert.match(prompt.userPrompt, /time complexity/i);
  assert.match(prompt.userPrompt, /```javascript/);
});
