import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileNotFoundError } from '@ccm/types';
import { readJsonFile, writeJsonFile, readTextFile, fileExists, ensureDir } from '../../utils/file-ops';

describe('file-ops', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'file-ops-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('writeJsonFile / readJsonFile', () => {
    it('round-trips a JSON object', async () => {
      const filePath = join(tempDir, 'test.json');
      const data = { foo: 'bar', count: 42, nested: { x: true } };
      await writeJsonFile(filePath, data);
      const result = await readJsonFile(filePath);
      expect(result).toEqual(data);
    });

    it('creates parent directories automatically when writing', async () => {
      const filePath = join(tempDir, 'deep', 'nested', 'dir', 'test.json');
      const data = { hello: 'world' };
      await writeJsonFile(filePath, data);
      const result = await readJsonFile(filePath);
      expect(result).toEqual(data);
    });

    it('throws FileNotFoundError when reading a missing file', async () => {
      const filePath = join(tempDir, 'missing.json');
      await expect(readJsonFile(filePath)).rejects.toThrow(FileNotFoundError);
    });

    it('includes the file path in FileNotFoundError', async () => {
      const filePath = join(tempDir, 'missing.json');
      try {
        await readJsonFile(filePath);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(FileNotFoundError);
        expect((err as FileNotFoundError).filePath).toBe(filePath);
      }
    });
  });

  describe('readTextFile', () => {
    it('reads a text file as a string', async () => {
      const filePath = join(tempDir, 'hello.txt');
      await writeJsonFile(filePath, 'just testing');
      const raw = await readTextFile(filePath);
      // The file will be a JSON string
      expect(raw).toContain('just testing');
    });

    it('throws FileNotFoundError when file is missing', async () => {
      const filePath = join(tempDir, 'missing.txt');
      await expect(readTextFile(filePath)).rejects.toThrow(FileNotFoundError);
    });
  });

  describe('fileExists', () => {
    it('returns true when a file exists', async () => {
      const filePath = join(tempDir, 'exists.json');
      await writeJsonFile(filePath, {});
      expect(await fileExists(filePath)).toBe(true);
    });

    it('returns false when a file does not exist', async () => {
      const filePath = join(tempDir, 'nope.json');
      expect(await fileExists(filePath)).toBe(false);
    });

    it('returns true for an existing directory', async () => {
      expect(await fileExists(tempDir)).toBe(true);
    });
  });

  describe('ensureDir', () => {
    it('creates a directory that does not exist', async () => {
      const dirPath = join(tempDir, 'new-dir');
      await ensureDir(dirPath);
      expect(await fileExists(dirPath)).toBe(true);
    });

    it('creates nested directories', async () => {
      const dirPath = join(tempDir, 'a', 'b', 'c', 'd');
      await ensureDir(dirPath);
      expect(await fileExists(dirPath)).toBe(true);
    });

    it('does not throw if the directory already exists', async () => {
      await expect(ensureDir(tempDir)).resolves.not.toThrow();
    });
  });
});
