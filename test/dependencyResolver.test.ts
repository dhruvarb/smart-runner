import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDependenciesFromText } from '../src/dependencyResolver';
import type { LanguageDefinition } from '../src/languageRegistry';

const python: LanguageDefinition = {
  id: 'python',
  displayName: 'Python',
  fileExtension: '.py',
  tempFileName: 'snippet.py'
};

test('includes Python variable dependencies used by selected code', () => {
  const result = resolveDependenciesFromText(
    ['x = 10', 'y = 20', '', 'print(x + y)', '', 'print("Hello")'].join('\n'),
    python,
    'print(x + y)'
  );

  assert.equal(result.runnableText, 'x = 10\n\ny = 20\n\nprint(x + y)');
  assert.deepEqual(result.includedDependencies, ['x = 10', 'y = 20']);
  assert.deepEqual(result.unresolvedDependencies, []);
});

test('warns about missing Python dependencies', () => {
  const result = resolveDependenciesFromText(
    'x = 10\nprint(x + y)',
    python,
    'print(x + y)'
  );

  assert.equal(result.runnableText, 'x = 10\n\nprint(x + y)');
  assert.deepEqual(result.unresolvedDependencies, ['y']);
});

test('does not warn about function parameters as missing dependencies', () => {
  const result = resolveDependenciesFromText(
    ['def square(value):', '    return value * value', '', 'print(square(5))'].join('\n'),
    python,
    'print(square(5))'
  );

  assert.equal(
    result.runnableText,
    'def square(value):\n    return value * value\n\nprint(square(5))'
  );
  assert.deepEqual(result.unresolvedDependencies, []);
});
