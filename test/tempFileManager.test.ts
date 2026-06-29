import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  cleanupTemporarySnippetFile,
  createTemporarySnippetFile
} from '../src/tempFileManager';

test('creates and cleans up a temporary snippet file', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'smart-runner-test-'));
  const tempFile = await createTemporarySnippetFile(
    'console.log("hello");',
    'snippet.js',
    tempRoot
  );

  assert.equal(await fs.readFile(tempFile.filePath, 'utf8'), 'console.log("hello");');

  await cleanupTemporarySnippetFile(tempFile);
  await assert.rejects(fs.stat(tempFile.filePath));
  await fs.rm(tempRoot, { recursive: true, force: true });
});
