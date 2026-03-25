import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { FileNotFoundError } from '@ccm/types';

export async function readJsonFile(filePath: string): Promise<unknown> {
  try {
    const text = await readFile(filePath, 'utf-8');
    return JSON.parse(text);
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw err;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readTextFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw err;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

interface NodeError extends Error {
  code: string;
}

function isNodeError(err: unknown): err is NodeError {
  return err instanceof Error && 'code' in err;
}
