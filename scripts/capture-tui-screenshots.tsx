#!/usr/bin/env node
/**
 * Renders each TUI page in isolation using ink-testing-library, captures
 * lastFrame(), and writes the frame text to docs/screenshots/<page>.txt.
 * These are then embedded in README.md as fenced code blocks.
 *
 * NOTE: Run via vitest (not tsx directly) since yoga-layout requires ESM:
 *
 *   node_modules/.bin/vitest run \
 *     packages/cli/src/__tests__/tui/capture-screenshots.test.tsx
 *
 * This script is the standalone reference; the actual capture harness lives at
 * packages/cli/src/__tests__/tui/capture-screenshots.test.tsx
 */

import { render } from 'ink-testing-library';
import React from 'react';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { initI18n } from '../packages/cli/src/tui/i18n.js';
import { Overview }      from '../packages/cli/src/tui/pages/Overview.js';
import { Sessions }      from '../packages/cli/src/tui/pages/Sessions.js';
import { Recommended }   from '../packages/cli/src/tui/pages/Recommended.js';
import { SettingsPrefs } from '../packages/cli/src/tui/pages/SettingsPrefs.js';
import { Plugins }       from '../packages/cli/src/tui/pages/config/Plugins.js';
import { McpServers }    from '../packages/cli/src/tui/pages/config/McpServers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const OUT_DIR = resolve(__dirname, '../docs/screenshots');
mkdirSync(OUT_DIR, { recursive: true });

initI18n('en');

// Strip ANSI escape sequences — code fences in README don't render colors.
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '');
}

function captureFrame(node: React.ReactElement, name: string) {
  const { lastFrame } = render(node);
  const plain = stripAnsi(lastFrame() ?? '');
  writeFileSync(resolve(OUT_DIR, `${name}.txt`), plain);
  console.log(`Captured ${name}.txt  (${plain.split('\n').length} lines)`);
}

// ---------- mock store helpers ----------

function makeStore(actions: Record<string, () => unknown> = {}) {
  return {
    getState: () => ({
      togglePlugin:        () => {},
      toggleMcp:           () => {},
      toggleSkill:         () => {},
      switchProfile:       () => {},
      setModel:            () => {},
      setLanguage:         () => {},
      pushToast:           () => {},
      openModal:           () => {},
      loadSessionHistory:  () => {},
      loadRecommendations: () => {},
      setInnerTab:         () => {},
      setPage:             () => {},
      setFocus:            () => {},
      ...actions,
    }),
  } as any;
}

// ---------- OVERVIEW ----------

const overviewState: any = {
  activeProfile: 'work',
  plugins:    Array.from({ length: 29 }, (_, i) => ({ name: `plugin-${i}`, enabled: true })),
  mcpServers: Array.from({ length: 13 }, (_, i) => ({ name: `mcp-${i}`, enabled: true })),
  skills:     Array.from({ length: 86 }, (_, i) => ({ name: `skill-${i}`, enabled: true })),
  commands:   [],
  sessions: [
    { projectDir: '/Users/me/repos/foo', name: 'feature work',  alive: true,  sessionId: 'a3f9c2bd-1111-2222-3333-444455556666', historyFile: '/x/a.jsonl', startedAt: Date.now() - 7_200_000 },
    { projectDir: '/Users/me/repos/bar', name: 'bug fix',       alive: false, sessionId: 'b8e4f1a2-aaaa-bbbb-cccc-ddddeeeeffff', historyFile: '/x/b.jsonl', startedAt: Date.now() - 86_400_000 },
    { projectDir: '/Users/me/repos/baz', name: 'experiment',    alive: false, sessionId: 'c1d9e3b4-1234-5678-9abc-def012345678', historyFile: '/x/c.jsonl', startedAt: Date.now() - 432_000_000 },
  ],
  dashboardStatus: { running: false },
  loading: {},
};
captureFrame(<Overview state={overviewState} />, 'overview');

// ---------- CONFIG — PLUGINS ----------

const pluginsState: any = {
  plugins: [
    { name: 'vercel@claude-plugins-official',      version: '0.40.0', enabled: true,  source: 'official' },
    { name: 'remember@claude-plugins-official',    version: '0.6.0',  enabled: true,  source: 'official' },
    { name: 'superpowers@claude-plugins-official', version: '5.0.7',  enabled: true,  source: 'official' },
    { name: 'feature-dev@claude-plugins-official', version: '1.0.0',  enabled: true,  source: 'official' },
    { name: 'serena@claude-plugins-official',      version: '0.9.1',  enabled: true,  source: 'official' },
    { name: 'experiment-plugin',                   version: '0.1.0',  enabled: false, source: 'user'     },
  ],
  pendingActions: new Set<string>(),
  focused: 'main',
};
captureFrame(<Plugins state={pluginsState} store={makeStore()} />, 'config-plugins');

// ---------- CONFIG — MCP SERVERS ----------

const mcpsState: any = {
  mcpServers: [
    { name: 'serena',          enabled: true,  config: { command: 'uvx serena' } },
    { name: 'context7',        enabled: true,  config: { command: 'npx context7' } },
    { name: 'chrome-devtools', enabled: true,  config: { command: 'npx chrome-devtools' } },
    { name: 'playwright',      enabled: false, config: { command: 'npx playwright' } },
  ],
  pendingActions: new Set<string>(),
  focused: 'main',
};
captureFrame(<McpServers state={mcpsState} store={makeStore()} />, 'config-mcps');

// ---------- SESSIONS ----------

const sessionsState: any = {
  sessions: [
    { sessionId: 'a3f9c2bd-1111-2222-3333-444455556666', projectDir: '/Users/me/repos/foo',  name: 'feature work', alive: true,  pid: 12345, historyFile: '/h/.claude/projects/a.jsonl', startedAt: Date.now() - 7_200_000 },
    { sessionId: 'b8e4f1a2-aaaa-bbbb-cccc-ddddeeeeffff', projectDir: '/Users/me/repos/bar',  name: 'bug fix',      alive: false, pid: 23456, historyFile: '/h/.claude/projects/b.jsonl', startedAt: Date.now() - 86_400_000 },
    { sessionId: 'c1d9e3b4-1234-5678-9abc-def012345678', projectDir: '/Users/me/repos/baz',  name: 'experiment',   alive: false, pid: 34567, historyFile: '/h/.claude/projects/c.jsonl', startedAt: Date.now() - 432_000_000 },
  ],
  sessionHistories: new Map([
    ['/h/.claude/projects/a.jsonl', [
      { role: 'user', text: 'how do I add jwt auth to express', timestamp: '' },
      { role: 'user', text: 'fix the failing integration test',   timestamp: '' },
      { role: 'user', text: 'refactor the user module',           timestamp: '' },
    ]],
  ]),
  focused: 'main',
};
captureFrame(<Sessions state={sessionsState} store={makeStore()} />, 'sessions');

// ---------- RECOMMENDED ----------

const recommendedState: any = {
  recommendations: [
    { name: '@modelcontextprotocol/server-postgres', type: 'mcp',    description: 'Postgres MCP server',     installCommand: 'npx -y @modelcontextprotocol/server-postgres', popularity: 'Top'      },
    { name: 'kubernetes-mcp-server',                type: 'mcp',    description: 'Kubernetes MCP server',   installCommand: 'npx -y kubernetes-mcp-server',                popularity: 'Trending' },
    { name: 'devtools-cli',                         type: 'plugin', description: 'Suite of devtools',       installCommand: '/plugin install devtools-cli@official',       popularity: 'Top'      },
    { name: 'database-design',                      type: 'skill',  description: 'Schema design helper',    installCommand: 'npx skills add owner/repo@database-design',   popularity: 'Top'      },
  ],
  focused: 'main',
};
captureFrame(<Recommended state={recommendedState} store={makeStore()} />, 'recommended');

// ---------- SETTINGS / PREFS ----------

const settingsPrefsState: any = {
  settings: { env: { CLAUDE_CONFIG_LANG: 'en' } },
  focused: 'main',
};
captureFrame(<SettingsPrefs state={settingsPrefsState} store={makeStore()} />, 'settings-prefs');

console.log('\nAll screenshots captured to', OUT_DIR);
