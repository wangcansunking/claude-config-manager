# Claude Config Manager — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Turborepo monorepo npm package that provides a web dashboard, MCP tools, CLI, and profile export/import for managing Claude Code configurations.

**Architecture:** 5 packages in a Turborepo workspace — `@ccm/types` (shared types + validators), `@ccm/core` (business logic managers), `@ccm/dashboard` (Next.js web UI), `@ccm/mcp` (MCP server with 19 tools), `@ccm/cli` (Commander.js CLI). All entry points call `@ccm/core` which reads/writes `~/.claude/` filesystem.

**Tech Stack:** TypeScript, Turborepo, Next.js 14 (App Router), React 18, Tailwind CSS, MCP SDK, Commander.js, Vitest, Playwright, Zod

---

## Chunk 1: Project Scaffolding + @ccm/types

### Task 1: Initialize Turborepo Workspace

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Initialize git repo**

```bash
cd /c/repos/claude-go
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "claude-config-manager",
  "version": "1.0.0-draft",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0",
    "eslint": "^9.0.0",
    "prettier": "^3.3.0"
  },
  "packageManager": "npm@10.0.0"
}
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": false
    },
    "test:e2e": {
      "cache": false
    },
    "lint": {},
    "type-check": {},
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.next/
.turbo/
coverage/
*.tsbuildinfo
.env*.local
.superpowers/
```

- [ ] **Step 6: Create package directories**

```bash
mkdir -p packages/{types,core,dashboard,mcp,cli}/src
```

- [ ] **Step 7: Install root dependencies**

Run: `npm install`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize turborepo workspace"
```

---

### Task 2: Create @ccm/types Package — Error Types + Validators

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/errors.ts`
- Create: `packages/types/src/plugin.ts`
- Create: `packages/types/src/mcp-server.ts`
- Create: `packages/types/src/profile.ts`
- Create: `packages/types/src/config.ts`
- Create: `packages/types/src/skill.ts`
- Test: `packages/types/src/__tests__/validators.test.ts`

- [ ] **Step 1: Create packages/types/package.json**

```json
{
  "name": "@ccm/types",
  "version": "1.0.0-draft",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create packages/types/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write failing tests for type guards**

Create `packages/types/src/__tests__/validators.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  isInstalledPlugin,
  isMcpServerConfig,
  isProfile,
  isClaudeSettings,
  isProfileExport,
} from '../index';

describe('Type Guards', () => {
  describe('isInstalledPlugin', () => {
    it('returns true for valid plugin', () => {
      const plugin = {
        name: 'superpowers',
        version: '5.0.5',
        marketplace: 'claude-plugins-official',
        enabled: true,
        installPath: '/path/to/plugin',
        installedAt: '2026-01-01T00:00:00Z',
        lastUpdated: '2026-03-01T00:00:00Z',
      };
      expect(isInstalledPlugin(plugin)).toBe(true);
    });

    it('returns false for missing required fields', () => {
      expect(isInstalledPlugin({ name: 'test' })).toBe(false);
      expect(isInstalledPlugin(null)).toBe(false);
      expect(isInstalledPlugin(42)).toBe(false);
    });
  });

  describe('isMcpServerConfig', () => {
    it('returns true for valid config', () => {
      const config = {
        command: 'npx',
        args: ['-y', 'azure-devops-mcp'],
      };
      expect(isMcpServerConfig(config)).toBe(true);
    });

    it('returns true with optional env', () => {
      const config = {
        command: 'node',
        args: ['server.js'],
        env: { API_KEY: 'test' },
      };
      expect(isMcpServerConfig(config)).toBe(true);
    });

    it('returns false for invalid config', () => {
      expect(isMcpServerConfig({})).toBe(false);
      expect(isMcpServerConfig({ command: 123 })).toBe(false);
    });
  });

  describe('isProfile', () => {
    it('returns true for valid profile', () => {
      const profile = {
        name: 'Work',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        plugins: [],
        mcpServers: {},
        settings: {},
        commands: [],
        hooks: {},
      };
      expect(isProfile(profile)).toBe(true);
    });

    it('returns false for missing name', () => {
      expect(isProfile({ plugins: [] })).toBe(false);
    });
  });

  describe('isProfileExport', () => {
    it('returns true for valid export format', () => {
      const exp = {
        version: '1.0',
        name: 'Work',
        createdAt: '2026-01-01T00:00:00Z',
        machine: 'DESKTOP-ABC',
        plugins: { installed: [], enabled: {} },
        mcpServers: {},
        settings: {},
        hooks: {},
        commands: [],
      };
      expect(isProfileExport(exp)).toBe(true);
    });

    it('returns false for missing version', () => {
      expect(isProfileExport({ name: 'Work' })).toBe(false);
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd packages/types && npx vitest run`
Expected: FAIL — imports not found

- [ ] **Step 5: Implement errors.ts**

```typescript
// packages/types/src/errors.ts
export class CcmError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CcmError';
  }
}

export class FileNotFoundError extends CcmError {
  constructor(path: string) {
    super(`File not found: ${path}`, 'FILE_NOT_FOUND', { path });
    this.name = 'FileNotFoundError';
  }
}

export class ValidationError extends CcmError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class PluginInstallError extends CcmError {
  constructor(pluginName: string, reason: string) {
    super(`Failed to install ${pluginName}: ${reason}`, 'PLUGIN_INSTALL_ERROR', { pluginName, reason });
    this.name = 'PluginInstallError';
  }
}

export class ConflictError extends CcmError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', context);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends CcmError {
  constructor(entity: string, identifier: string) {
    super(`${entity} not found: ${identifier}`, 'NOT_FOUND', { entity, identifier });
    this.name = 'NotFoundError';
  }
}
```

- [ ] **Step 6: Implement plugin.ts**

```typescript
// packages/types/src/plugin.ts
import { z } from 'zod';

export const InstalledPluginSchema = z.object({
  name: z.string(),
  version: z.string(),
  marketplace: z.string(),
  enabled: z.boolean(),
  installPath: z.string(),
  installedAt: z.string(),
  lastUpdated: z.string(),
  gitCommitSha: z.string().optional(),
  scope: z.enum(['user', 'project']).optional(),
});

export type InstalledPlugin = z.infer<typeof InstalledPluginSchema>;

export function isInstalledPlugin(value: unknown): value is InstalledPlugin {
  return InstalledPluginSchema.safeParse(value).success;
}

export interface PluginListEntry {
  name: string;
  marketplace: string;
  version: string;
  enabled: boolean;
  installedAt: string;
  lastUpdated: string;
  skillCount: number;
  description?: string;
}

export interface MarketplacePlugin {
  name: string;
  description: string;
  version: string;
  marketplace: string;
}
```

- [ ] **Step 7: Implement mcp-server.ts**

```typescript
// packages/types/src/mcp-server.ts
import { z } from 'zod';

export const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
});

export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;

export function isMcpServerConfig(value: unknown): value is McpServerConfig {
  return McpServerConfigSchema.safeParse(value).success;
}

export interface McpServerEntry {
  name: string;
  config: McpServerConfig;
  scope: 'user' | 'project';
}
```

- [ ] **Step 8: Implement config.ts**

```typescript
// packages/types/src/config.ts
import { z } from 'zod';

export const HookEntrySchema = z.object({
  type: z.string(),
  command: z.string(),
  statusMessage: z.string().optional(),
});

export const HookConfigSchema = z.object({
  matcher: z.string().optional(),
  hooks: z.array(HookEntrySchema),
});

export const ClaudeSettingsSchema = z.object({
  model: z.string().optional(),
  enabledPlugins: z.record(z.boolean()).optional(),
  autoUpdatesChannel: z.string().optional(),
  skipDangerousModePermissionPrompt: z.boolean().optional(),
  env: z.record(z.string()).optional(),
  hooks: z.record(z.array(HookConfigSchema)).optional(),
  permissions: z.any().optional(),
});

export type HookEntry = z.infer<typeof HookEntrySchema>;
export type HookConfig = z.infer<typeof HookConfigSchema>;
export type ClaudeSettings = z.infer<typeof ClaudeSettingsSchema>;

export function isClaudeSettings(value: unknown): value is ClaudeSettings {
  return ClaudeSettingsSchema.safeParse(value).success;
}
```

- [ ] **Step 9: Implement profile.ts**

```typescript
// packages/types/src/profile.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  plugins: z.array(z.object({
    name: z.string(),
    marketplace: z.string(),
    version: z.string().optional(),
    enabled: z.boolean().default(true),
  })).default([]),
  mcpServers: z.record(z.object({
    command: z.string(),
    args: z.array(z.string()).default([]),
    env: z.record(z.string()).optional(),
  })).default({}),
  settings: z.object({
    model: z.string().optional(),
    env: z.record(z.string()).optional(),
    autoUpdatesChannel: z.string().optional(),
  }).default({}),
  hooks: z.record(z.any()).default({}),
  commands: z.array(z.object({
    name: z.string(),
    content: z.string().optional(),
  })).default([]),
});

export type Profile = z.infer<typeof ProfileSchema>;

export function isProfile(value: unknown): value is Profile {
  return ProfileSchema.safeParse(value).success;
}

export const ProfileExportSchema = z.object({
  version: z.string(),
  name: z.string(),
  createdAt: z.string(),
  machine: z.string().optional(),
  plugins: z.object({
    installed: z.array(z.object({
      name: z.string(),
      marketplace: z.string(),
      version: z.string().optional(),
    })),
    enabled: z.record(z.boolean()),
  }),
  mcpServers: z.record(z.any()),
  settings: z.record(z.any()),
  hooks: z.record(z.any()),
  commands: z.array(z.any()),
});

export type ProfileExport = z.infer<typeof ProfileExportSchema>;

export function isProfileExport(value: unknown): value is ProfileExport {
  return ProfileExportSchema.safeParse(value).success;
}

export interface ProfileManifest {
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  pluginCount: number;
  mcpServerCount: number;
}
```

- [ ] **Step 10: Implement skill.ts**

```typescript
// packages/types/src/skill.ts
export interface SkillDefinition {
  name: string;
  description: string;
  pluginName: string;
  path: string;
  type?: 'rigid' | 'flexible';
}

export interface CommandDefinition {
  name: string;
  description?: string;
  path: string;
  source: 'plugin' | 'custom';
  pluginName?: string;
}
```

- [ ] **Step 11: Implement index.ts barrel export**

```typescript
// packages/types/src/index.ts
export * from './errors';
export * from './plugin';
export * from './mcp-server';
export * from './config';
export * from './profile';
export * from './skill';
```

- [ ] **Step 12: Run tests to verify they pass**

Run: `cd packages/types && npx vitest run`
Expected: ALL PASS

- [ ] **Step 13: Build the package**

Run: `cd packages/types && npm run build`
Expected: `dist/` created successfully

- [ ] **Step 14: Commit**

```bash
git add packages/types/
git commit -m "feat: add @ccm/types with Zod schemas, type guards, and error classes"
```

---

## Chunk 2: @ccm/core — Business Logic Layer

### Task 3: Create @ccm/core Package — Utilities

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/utils/path-resolver.ts`
- Create: `packages/core/src/utils/file-ops.ts`
- Test: `packages/core/src/__tests__/utils/path-resolver.test.ts`
- Test: `packages/core/src/__tests__/utils/file-ops.test.ts`

- [ ] **Step 1: Create packages/core/package.json**

```json
{
  "name": "@ccm/core",
  "version": "1.0.0-draft",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@ccm/types": "workspace:*",
    "simple-git": "^3.25.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["src/__tests__/**"]
}
```

- [ ] **Step 3: Write failing tests for path-resolver**

```typescript
// packages/core/src/__tests__/utils/path-resolver.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getClaudeHome, claudePath } from '../../utils/path-resolver';
import { join } from 'path';
import { homedir } from 'os';

describe('path-resolver', () => {
  it('getClaudeHome returns ~/.claude', () => {
    const result = getClaudeHome();
    expect(result).toBe(join(homedir(), '.claude'));
  });

  it('claudePath joins segments under claude home', () => {
    const result = claudePath('plugins', 'installed_plugins.json');
    expect(result).toBe(join(homedir(), '.claude', 'plugins', 'installed_plugins.json'));
  });

  it('claudePath with no args returns claude home', () => {
    expect(claudePath()).toBe(join(homedir(), '.claude'));
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/utils/path-resolver.test.ts`
Expected: FAIL

- [ ] **Step 5: Implement path-resolver.ts**

```typescript
// packages/core/src/utils/path-resolver.ts
import { join } from 'path';
import { homedir } from 'os';

export function getClaudeHome(): string {
  return join(homedir(), '.claude');
}

export function claudePath(...segments: string[]): string {
  return join(getClaudeHome(), ...segments);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/utils/path-resolver.test.ts`
Expected: PASS

- [ ] **Step 7: Write failing tests for file-ops**

```typescript
// packages/core/src/__tests__/utils/file-ops.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readJsonFile, writeJsonFile, fileExists, ensureDir } from '../../utils/file-ops';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('file-ops', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ccm-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('writeJsonFile and readJsonFile roundtrip', async () => {
    const filePath = join(tempDir, 'test.json');
    const data = { name: 'test', value: 42 };
    await writeJsonFile(filePath, data);
    const result = await readJsonFile(filePath);
    expect(result).toEqual(data);
  });

  it('readJsonFile throws for missing file', async () => {
    await expect(readJsonFile(join(tempDir, 'nope.json'))).rejects.toThrow();
  });

  it('fileExists returns false for missing file', async () => {
    expect(await fileExists(join(tempDir, 'nope.json'))).toBe(false);
  });

  it('fileExists returns true for existing file', async () => {
    const filePath = join(tempDir, 'exists.json');
    await writeJsonFile(filePath, {});
    expect(await fileExists(filePath)).toBe(true);
  });

  it('ensureDir creates nested directories', async () => {
    const nested = join(tempDir, 'a', 'b', 'c');
    await ensureDir(nested);
    expect(await fileExists(nested)).toBe(false); // it's a dir, not a file
    // verify by writing a file inside it
    const filePath = join(nested, 'test.json');
    await writeJsonFile(filePath, { ok: true });
    expect(await readJsonFile(filePath)).toEqual({ ok: true });
  });
});
```

- [ ] **Step 8: Implement file-ops.ts**

```typescript
// packages/core/src/utils/file-ops.ts
import { readFile, writeFile, mkdir, access, stat } from 'fs/promises';
import { dirname } from 'path';
import { FileNotFoundError } from '@ccm/types';

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw err;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function readTextFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
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
```

- [ ] **Step 9: Run tests, verify pass**

Run: `cd packages/core && npx vitest run`
Expected: ALL PASS

- [ ] **Step 10: Commit**

```bash
git add packages/core/
git commit -m "feat: add @ccm/core utilities — path-resolver and file-ops"
```

---

### Task 4: @ccm/core — ConfigManager

**Files:**
- Create: `packages/core/src/managers/config-manager.ts`
- Test: `packages/core/src/__tests__/managers/config-manager.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/core/src/__tests__/managers/config-manager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../managers/config-manager';
import { writeJsonFile, readJsonFile } from '../../utils/file-ops';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigManager', () => {
  let tempDir: string;
  let manager: ConfigManager;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ccm-config-'));
    manager = new ConfigManager(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('getSettings returns empty object for missing settings.json', async () => {
    const settings = await manager.getSettings();
    expect(settings).toEqual({});
  });

  it('getSettings reads existing settings.json', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), { model: 'opus[1m]' });
    const settings = await manager.getSettings();
    expect(settings.model).toBe('opus[1m]');
  });

  it('updateSettings merges partial updates', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), { model: 'opus[1m]' });
    await manager.updateSettings({ env: { FOO: '1' } });
    const settings = await manager.getSettings();
    expect(settings.model).toBe('opus[1m]');
    expect(settings.env?.FOO).toBe('1');
  });

  it('getModel returns model string', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), { model: 'sonnet' });
    expect(await manager.getModel()).toBe('sonnet');
  });

  it('setModel updates model', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), { model: 'sonnet' });
    await manager.setModel('opus[1m]');
    expect(await manager.getModel()).toBe('opus[1m]');
  });

  it('getEnvVars returns env record', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), { env: { A: '1', B: '2' } });
    const envVars = await manager.getEnvVars();
    expect(envVars).toEqual({ A: '1', B: '2' });
  });

  it('setEnvVar adds a new variable', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), {});
    await manager.setEnvVar('KEY', 'VALUE');
    const settings = await manager.getSettings();
    expect(settings.env?.KEY).toBe('VALUE');
  });

  it('removeEnvVar deletes a variable', async () => {
    await writeJsonFile(join(tempDir, 'settings.json'), { env: { A: '1', B: '2' } });
    await manager.removeEnvVar('A');
    const envVars = await manager.getEnvVars();
    expect(envVars).toEqual({ B: '2' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/managers/config-manager.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement ConfigManager**

```typescript
// packages/core/src/managers/config-manager.ts
import { join } from 'path';
import { ClaudeSettings } from '@ccm/types';
import { readJsonFile, writeJsonFile, fileExists } from '../utils/file-ops';

export class ConfigManager {
  private settingsPath: string;

  constructor(claudeHome: string) {
    this.settingsPath = join(claudeHome, 'settings.json');
  }

  async getSettings(): Promise<ClaudeSettings> {
    if (!(await fileExists(this.settingsPath))) {
      return {};
    }
    return readJsonFile<ClaudeSettings>(this.settingsPath);
  }

  async updateSettings(patch: Partial<ClaudeSettings>): Promise<void> {
    const current = await this.getSettings();
    const merged = { ...current, ...patch };
    await writeJsonFile(this.settingsPath, merged);
  }

  async getModel(): Promise<string | undefined> {
    const settings = await this.getSettings();
    return settings.model;
  }

  async setModel(model: string): Promise<void> {
    await this.updateSettings({ model });
  }

  async getEnvVars(): Promise<Record<string, string>> {
    const settings = await this.getSettings();
    return settings.env ?? {};
  }

  async setEnvVar(key: string, value: string): Promise<void> {
    const settings = await this.getSettings();
    const env = { ...(settings.env ?? {}), [key]: value };
    await this.updateSettings({ env });
  }

  async removeEnvVar(key: string): Promise<void> {
    const settings = await this.getSettings();
    const env = { ...(settings.env ?? {}) };
    delete env[key];
    await this.updateSettings({ env });
  }

  async getHooks(): Promise<Record<string, unknown[]>> {
    const settings = await this.getSettings();
    return (settings.hooks as Record<string, unknown[]>) ?? {};
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `cd packages/core && npx vitest run src/__tests__/managers/config-manager.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/managers/config-manager.ts packages/core/src/__tests__/managers/config-manager.test.ts
git commit -m "feat: add ConfigManager — read/write settings, env vars, model"
```

---

### Task 5: @ccm/core — PluginManager

**Files:**
- Create: `packages/core/src/managers/plugin-manager.ts`
- Test: `packages/core/src/__tests__/managers/plugin-manager.test.ts`

- [ ] **Step 1: Write failing tests**

Tests should cover: `list()`, `getDetail(name)`, `toggle(name, enabled)`, `remove(name)`, `isInstalled(name)`. Install/update tested separately as they require git operations.

- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement PluginManager** — reads `plugins/installed_plugins.json` and `settings.json` enabledPlugins, scans `plugins/cache/` for plugin metadata.
- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add PluginManager — list, detail, toggle, remove plugins"
```

---

### Task 6: @ccm/core — McpManager

**Files:**
- Create: `packages/core/src/managers/mcp-manager.ts`
- Test: `packages/core/src/__tests__/managers/mcp-manager.test.ts`

- [ ] **Step 1: Write failing tests**

Tests should cover: `list()`, `add(name, config)`, `remove(name)`, `getDetail(name)`. MCP servers are stored in `settings.json` under `mcpServers` key.

- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement McpManager**
- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add McpManager — list, add, remove MCP server configs"
```

---

### Task 7: @ccm/core — SkillScanner

**Files:**
- Create: `packages/core/src/managers/skill-scanner.ts`
- Test: `packages/core/src/__tests__/managers/skill-scanner.test.ts`

- [ ] **Step 1: Write failing tests**

Tests: `scan()` discovers skills from plugin cache directories by reading `skills/` folders and parsing markdown frontmatter. `getSkillContent(path)` reads skill file content.

- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement SkillScanner** — walks plugin cache dirs, finds `skills/*/Skill.md` files, parses YAML frontmatter for name/description.
- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add SkillScanner — discover and parse skills from plugins"
```

---

### Task 8: @ccm/core — ProfileManager

**Files:**
- Create: `packages/core/src/managers/profile-manager.ts`
- Test: `packages/core/src/__tests__/managers/profile-manager.test.ts`

- [ ] **Step 1: Write failing tests**

Tests: `list()`, `create(name)`, `activate(name)`, `delete(name)`, `getActive()`, `exportProfile(name)`, `importProfile(data, strategy)`. Profiles stored in `~/.claude/plugins/profiles/`.

- [ ] **Step 2: Run tests to verify failure**
- [ ] **Step 3: Implement ProfileManager** — creates profile by snapshotting current config + selected components, stores as JSON in profiles dir, tracks active profile in `active.json`.
- [ ] **Step 4: Run tests, verify pass**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add ProfileManager — create, activate, export, import profiles"
```

---

### Task 9: @ccm/core — Barrel Export

**Files:**
- Create: `packages/core/src/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
// packages/core/src/index.ts
export { ConfigManager } from './managers/config-manager';
export { PluginManager } from './managers/plugin-manager';
export { McpManager } from './managers/mcp-manager';
export { SkillScanner } from './managers/skill-scanner';
export { ProfileManager } from './managers/profile-manager';

export { getClaudeHome, claudePath } from './utils/path-resolver';
export { readJsonFile, writeJsonFile, fileExists, ensureDir } from './utils/file-ops';
```

- [ ] **Step 2: Build package**

Run: `cd packages/core && npm run build`
Expected: Success

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add @ccm/core barrel export"
```

---

## Chunk 3: @ccm/mcp — MCP Server

### Task 10: Create @ccm/mcp Package — Server + Query Tools

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/src/server.ts`
- Create: `packages/mcp/src/tools/query-tools.ts`
- Test: `packages/mcp/src/__tests__/query-tools.test.ts`

- [ ] **Step 1: Create package.json and tsconfig**
- [ ] **Step 2: Write failing tests for query tools** — test each tool handler returns correct shape
- [ ] **Step 3: Implement server.ts** — MCP SDK server with stdio transport, registers all tools
- [ ] **Step 4: Implement query-tools.ts** — `ccm_list_plugins`, `ccm_list_mcp_servers`, `ccm_list_skills`, `ccm_list_commands`, `ccm_get_config`, `ccm_get_component_detail`
- [ ] **Step 5: Run tests, verify pass**
- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add @ccm/mcp server with query tools"
```

---

### Task 11: @ccm/mcp — Mutation + Profile + Dashboard Tools

**Files:**
- Create: `packages/mcp/src/tools/mutation-tools.ts`
- Create: `packages/mcp/src/tools/profile-tools.ts`
- Create: `packages/mcp/src/tools/dashboard-tools.ts`
- Create: `packages/mcp/src/index.ts`
- Test: `packages/mcp/src/__tests__/mutation-tools.test.ts`
- Test: `packages/mcp/src/__tests__/profile-tools.test.ts`

- [ ] **Step 1: Write failing tests for mutation tools**
- [ ] **Step 2: Implement mutation-tools.ts** — 7 tools: install, update, remove, toggle plugin; add, remove MCP; update config
- [ ] **Step 3: Write failing tests for profile tools**
- [ ] **Step 4: Implement profile-tools.ts** — 6 tools: list, create, activate, export, import, delete profiles
- [ ] **Step 5: Implement dashboard-tools.ts** — `ccm_open_dashboard`, `ccm_dashboard_status`
- [ ] **Step 6: Create index.ts entry point**
- [ ] **Step 7: Run all MCP tests, verify pass**
- [ ] **Step 8: Commit**

```bash
git commit -m "feat: add mutation, profile, and dashboard MCP tools (19 total)"
```

---

## Chunk 4: @ccm/cli — Command Line Interface

### Task 12: Create @ccm/cli Package

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/src/commands/start.ts`
- Create: `packages/cli/src/commands/list.ts`
- Create: `packages/cli/src/commands/profile.ts`
- Create: `packages/cli/src/commands/export.ts`
- Create: `packages/cli/src/commands/import.ts`
- Create: `packages/cli/src/commands/mcp-server.ts`
- Test: `packages/cli/src/__tests__/list.test.ts`

- [ ] **Step 1: Create package.json** — with `"bin": { "claude-config": "./dist/index.js" }`
- [ ] **Step 2: Create tsconfig.json**
- [ ] **Step 3: Write failing tests for list command** — test output formatting
- [ ] **Step 4: Implement index.ts** — Commander.js program setup with all subcommands
- [ ] **Step 5: Implement start.ts** — launches Next.js dashboard on port 3399
- [ ] **Step 6: Implement list.ts** — `--plugins`, `--mcps`, `--skills`, `--json`
- [ ] **Step 7: Implement profile.ts** — `list`, `create`, `activate`, `delete` subcommands
- [ ] **Step 8: Implement export.ts** — `export <profile> -o file.json --format json|yaml`
- [ ] **Step 9: Implement import.ts** — `import <file> --dry-run --replace --activate`
- [ ] **Step 10: Implement mcp-server.ts** — starts MCP server in stdio mode
- [ ] **Step 11: Run tests, verify pass**
- [ ] **Step 12: Commit**

```bash
git commit -m "feat: add @ccm/cli with all commands — start, list, profile, export, import"
```

---

## Chunk 5: @ccm/dashboard — Next.js Web UI

### Task 13: Initialize Next.js Dashboard

**Files:**
- Create: `packages/dashboard/package.json`
- Create: `packages/dashboard/tsconfig.json`
- Create: `packages/dashboard/next.config.js`
- Create: `packages/dashboard/tailwind.config.ts`
- Create: `packages/dashboard/postcss.config.js`
- Create: `packages/dashboard/src/app/layout.tsx`
- Create: `packages/dashboard/src/app/globals.css`
- Create: `packages/dashboard/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create package.json** — Next.js 14, React 18, Tailwind CSS, @ccm/core, @ccm/types deps
- [ ] **Step 2: Create Next.js and Tailwind config** — dark theme design tokens as CSS variables
- [ ] **Step 3: Create globals.css** — design system tokens from design-spec (colors, typography, spacing)
- [ ] **Step 4: Create layout.tsx** — root layout with Sidebar component
- [ ] **Step 5: Create Sidebar component** — navigation items: Overview, Plugins, MCP Servers, Skills, Commands, Settings, divider, Profiles, Export/Import
- [ ] **Step 6: Verify dev server starts**

Run: `cd packages/dashboard && npx next dev -p 3399`
Expected: Dashboard loads with sidebar at http://localhost:3399

- [ ] **Step 7: Commit**

```bash
git commit -m "feat: initialize @ccm/dashboard with Next.js, Tailwind, sidebar layout"
```

---

### Task 14: Dashboard — Shared Components

**Files:**
- Create: `packages/dashboard/src/components/shared/stat-card.tsx`
- Create: `packages/dashboard/src/components/shared/tag.tsx`
- Create: `packages/dashboard/src/components/shared/status-badge.tsx`
- Create: `packages/dashboard/src/components/shared/search-box.tsx`
- Create: `packages/dashboard/src/components/shared/button.tsx`
- Create: `packages/dashboard/src/components/shared/confirmation-dialog.tsx`
- Create: `packages/dashboard/src/components/layout/detail-panel.tsx`
- Create: `packages/dashboard/src/components/layout/header.tsx`
- Create: `packages/dashboard/src/lib/api-client.ts`

- [ ] **Step 1: Implement shared components** — following design-spec color system and component library
- [ ] **Step 2: Implement DetailPanel** — slide-in from right, dimmed overlay, close button
- [ ] **Step 3: Implement api-client.ts** — fetch wrappers for all API routes
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add shared components — StatCard, Tag, DetailPanel, SearchBox, etc."
```

---

### Task 15: Dashboard — API Routes

**Files:**
- Create: `packages/dashboard/src/app/api/plugins/route.ts`
- Create: `packages/dashboard/src/app/api/mcp-servers/route.ts`
- Create: `packages/dashboard/src/app/api/skills/route.ts`
- Create: `packages/dashboard/src/app/api/settings/route.ts`
- Create: `packages/dashboard/src/app/api/settings/env/route.ts`
- Create: `packages/dashboard/src/app/api/profiles/route.ts`
- Create: `packages/dashboard/src/app/api/profiles/[name]/activate/route.ts`
- Create: `packages/dashboard/src/app/api/export/route.ts`
- Create: `packages/dashboard/src/app/api/import/route.ts`
- Create: `packages/dashboard/src/app/api/stats/route.ts`

- [ ] **Step 1: Implement plugins API routes** — GET list, POST install, DELETE remove, PATCH toggle
- [ ] **Step 2: Implement mcp-servers API routes** — GET list, POST add, DELETE remove
- [ ] **Step 3: Implement settings API routes** — GET/PATCH settings, GET/PUT/DELETE env vars
- [ ] **Step 4: Implement skills API route** — GET list (grouped by plugin)
- [ ] **Step 5: Implement profiles API routes** — GET list, POST create, DELETE, POST activate
- [ ] **Step 6: Implement export/import API routes** — POST export profile, POST import
- [ ] **Step 7: Implement stats API route** — counts for overview page
- [ ] **Step 8: Commit**

```bash
git commit -m "feat: add all dashboard API routes (27 routes)"
```

---

### Task 16: Dashboard — Overview Page

**Files:**
- Create: `packages/dashboard/src/app/page.tsx`

- [ ] **Step 1: Implement Overview page** — 4 stat cards (plugins, MCPs, skills, profiles) + recent plugins list + MCP servers list. See design-spec mockup.
- [ ] **Step 2: Verify in browser**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add Overview dashboard page with stats and lists"
```

---

### Task 17: Dashboard — Plugins Page + Detail Panel

**Files:**
- Create: `packages/dashboard/src/app/plugins/page.tsx`
- Create: `packages/dashboard/src/components/plugin-list/plugin-list.tsx`
- Create: `packages/dashboard/src/components/plugin-list/plugin-item.tsx`

- [ ] **Step 1: Implement PluginItem** — icon, name, version tag, marketplace tag, Update/Remove buttons
- [ ] **Step 2: Implement PluginList** — list with search/filter
- [ ] **Step 3: Implement Plugins page** — header with "Install New" button, plugin list, click to open DetailPanel
- [ ] **Step 4: Implement Plugin DetailPanel content** — metadata, skills list, agents list, actions
- [ ] **Step 5: Verify in browser**
- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add Plugins page with list, search, and detail panel"
```

---

### Task 18: Dashboard — MCP Servers Page + Detail Panel

**Files:**
- Create: `packages/dashboard/src/app/mcp-servers/page.tsx`
- Create: `packages/dashboard/src/components/mcp-list/mcp-list.tsx`
- Create: `packages/dashboard/src/components/mcp-list/mcp-item.tsx`

- [ ] **Step 1: Implement MCP components** — status dot, name, command, status tag
- [ ] **Step 2: Implement MCP Servers page** — list with Add Server button
- [ ] **Step 3: Implement MCP DetailPanel content** — connection config, env vars (masked), tools list with search, actions
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add MCP Servers page with status indicators and detail panel"
```

---

### Task 19: Dashboard — Skills + Commands Pages

**Files:**
- Create: `packages/dashboard/src/app/skills/page.tsx`
- Create: `packages/dashboard/src/app/commands/page.tsx`

- [ ] **Step 1: Implement Skills page** — grouped by plugin, skill items with type badge, click for detail
- [ ] **Step 2: Implement Skill DetailPanel content** — description, when to use, content preview, source plugin link
- [ ] **Step 3: Implement Commands page** — list of custom slash commands
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add Skills and Commands pages"
```

---

### Task 20: Dashboard — Settings Page

**Files:**
- Create: `packages/dashboard/src/app/settings/page.tsx`
- Create: `packages/dashboard/src/components/settings/model-selector.tsx`
- Create: `packages/dashboard/src/components/settings/env-vars-editor.tsx`
- Create: `packages/dashboard/src/components/settings/hooks-editor.tsx`

- [ ] **Step 1: Implement ModelSelector** — dropdown to select model
- [ ] **Step 2: Implement EnvVarsEditor** — key=value editor with add/remove
- [ ] **Step 3: Implement HooksEditor** — display hooks with event badge, matcher, command
- [ ] **Step 4: Implement Settings page** — combines all editors
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add Settings page with model, env vars, and hooks editors"
```

---

### Task 21: Dashboard — Profiles Page + Edit

**Files:**
- Create: `packages/dashboard/src/app/profiles/page.tsx`
- Create: `packages/dashboard/src/components/profile-grid/profile-grid.tsx`
- Create: `packages/dashboard/src/components/profile-grid/profile-card.tsx`

- [ ] **Step 1: Implement ProfileCard** — icon, name, date, component count tags, Activate/Edit/Export/Delete buttons
- [ ] **Step 2: Implement ProfileGrid** — 2-column grid of profile cards
- [ ] **Step 3: Implement Profiles page** — New Profile button, profile grid, create/edit dialog
- [ ] **Step 4: Implement Edit Profile** — checkbox grid for plugins, MCP list, settings section, hooks toggle, commands toggle
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add Profiles page with cards, create, edit, activate"
```

---

### Task 22: Dashboard — Export/Import Page

**Files:**
- Create: `packages/dashboard/src/app/export-import/page.tsx`
- Create: `packages/dashboard/src/components/export-import/export-panel.tsx`
- Create: `packages/dashboard/src/components/export-import/import-panel.tsx`

- [ ] **Step 1: Implement ExportPanel** — profile selector, include checkboxes, format selection, export button
- [ ] **Step 2: Implement ImportPanel** — drag-drop zone, preview with diff (conflicts, already installed), Merge/Replace buttons
- [ ] **Step 3: Implement Export/Import page** — side-by-side panels
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add Export/Import page with export panel and import wizard"
```

---

## Chunk 6: Integration + Plugin Manifest + E2E Tests

### Task 23: Plugin Manifest + npm Package Config

**Files:**
- Create: `plugin.json`
- Modify: `package.json` (root — add bin, exports)

- [ ] **Step 1: Create plugin.json** — registers MCP server, skills, commands for Claude Code plugin mode
- [ ] **Step 2: Update root package.json** — add `"bin"` field pointing to CLI
- [ ] **Step 3: Test global install locally**

Run: `npm link`
Run: `claude-config list`
Expected: Shows current Claude Code components

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add plugin.json manifest and npm package config"
```

---

### Task 24: Integration Tests

**Files:**
- Create: `packages/core/src/__tests__/integration/roundtrip.test.ts`

- [ ] **Step 1: Write profile export → import roundtrip test** — create temp claude home, install fixtures, create profile, export, import to fresh dir, verify identical
- [ ] **Step 2: Write MCP → Core integration test** — invoke MCP tool handlers, verify they call core correctly
- [ ] **Step 3: Run integration tests**
- [ ] **Step 4: Commit**

```bash
git commit -m "test: add integration tests — profile roundtrip, MCP-Core integration"
```

---

### Task 25: E2E Tests with Playwright

**Files:**
- Create: `packages/dashboard/e2e/overview.spec.ts`
- Create: `packages/dashboard/e2e/plugins.spec.ts`
- Create: `packages/dashboard/e2e/profiles.spec.ts`
- Create: `packages/dashboard/playwright.config.ts`

- [ ] **Step 1: Create Playwright config** — base URL localhost:3399, dark color scheme
- [ ] **Step 2: Write Overview page E2E** — verify stats cards render, plugin list shows items
- [ ] **Step 3: Write Plugins page E2E** — list loads, detail panel opens on click, close works
- [ ] **Step 4: Write Profiles page E2E** — create profile, see it in grid, activate
- [ ] **Step 5: Run E2E tests**

Run: `cd packages/dashboard && npx playwright test`

- [ ] **Step 6: Commit**

```bash
git commit -m "test: add E2E tests for Overview, Plugins, and Profiles pages"
```

---

### Task 26: Final Build + Verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: All 5 packages build successfully

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All unit + integration tests pass

- [ ] **Step 3: Test CLI globally**

```bash
npm link
claude-config start
# Verify dashboard opens at http://localhost:3399
claude-config list --json
# Verify JSON output of all components
```

- [ ] **Step 4: Test MCP server**

```bash
claude-config mcp-server
# Verify stdio MCP server starts and responds to tools/list
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: claude-config-manager v1.0.0-draft — complete implementation"
```
