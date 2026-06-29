import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

export interface TemporarySnippetFile {
  directoryPath: string;
  filePath: string;
}

export async function createTemporarySnippetFile(
  snippetText: string,
  fileNameOrExtension: string,
  tempDirectory?: string
): Promise<TemporarySnippetFile> {
  const fileName = normalizeFileName(fileNameOrExtension);
  const directoryPath = path.join(
    tempDirectory || os.tmpdir(),
    'smart-runner',
    crypto.randomUUID()
  );
  const filePath = path.join(directoryPath, fileName);

  await fs.mkdir(directoryPath, { recursive: true });
  await fs.writeFile(filePath, snippetText, 'utf8');

  return {
    directoryPath,
    filePath
  };
}

export async function cleanupTemporarySnippetFile(
  tempFile: TemporarySnippetFile
): Promise<void> {
  await fs.rm(tempFile.directoryPath, {
    recursive: true,
    force: true,
    maxRetries: 2
  });
}

function normalizeFileName(fileNameOrExtension: string): string {
  if (!fileNameOrExtension) {
    return 'snippet.txt';
  }

  if (fileNameOrExtension.startsWith('.')) {
    return `snippet${fileNameOrExtension}`;
  }

  return fileNameOrExtension.includes('.')
    ? fileNameOrExtension
    : `snippet.${fileNameOrExtension}`;
}
