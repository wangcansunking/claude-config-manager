import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { FileNotFoundError } from '@ccm/types';
export async function readJsonFile(filePath) {
    try {
        const text = await readFile(filePath, 'utf-8');
        return JSON.parse(text);
    }
    catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            throw new FileNotFoundError(filePath);
        }
        throw err;
    }
}
export async function writeJsonFile(filePath, data) {
    await ensureDir(dirname(filePath));
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
export async function readTextFile(filePath) {
    try {
        return await readFile(filePath, 'utf-8');
    }
    catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT') {
            throw new FileNotFoundError(filePath);
        }
        throw err;
    }
}
export async function fileExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function ensureDir(dirPath) {
    await mkdir(dirPath, { recursive: true });
}
function isNodeError(err) {
    return err instanceof Error && 'code' in err;
}
//# sourceMappingURL=file-ops.js.map