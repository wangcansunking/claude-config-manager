#!/usr/bin/env node
// Assemble a single self-contained npm package (`cc-config`) from the monorepo.
//
// Output layout (dist-npm/):
//   cli.mjs              esbuild bundle of the CLI (all first/third-party inlined)
//   dashboard/server.mjs the bundled dashboard server + its client/ assets
//   mcp/server.mjs       the bundled MCP stdio server
//   package.json         generated, publishable, self-contained (no workspace deps)
//   README.md
//
// The CLI resolves these siblings at runtime via packages/cli/src/lib/assets.ts.

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, rmSync, mkdirSync, cpSync, writeFileSync, readFileSync, chmodSync } from 'fs';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'dist-npm');

// Scoped name: the unscoped `cc-config` is blocked by npm's name-similarity
// guard (too close to the existing `ccconfig`). The bin names stay
// `claude-config` / `cc-config`, so the installed command is unaffected.
const PKG_NAME = '@wangcansun/cc-config';

function loadEsbuild() {
  const candidates = [
    resolve(ROOT, 'node_modules'),
    resolve(ROOT, 'packages/mcp/node_modules'),
    resolve(ROOT, 'packages/dashboard/node_modules'),
  ];
  const esbuildPath = require.resolve('esbuild', { paths: candidates });
  return require(esbuildPath);
}

function assertExists(path, hint) {
  if (!existsSync(path)) {
    console.error(`\nMissing build input: ${path}`);
    console.error(hint);
    process.exit(1);
  }
}

const rootPkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const version = rootPkg.version;

const dashServer = resolve(ROOT, 'packages/dashboard/dist/server.mjs');
const dashClient = resolve(ROOT, 'packages/dashboard/dist/client');
const mcpServer = resolve(ROOT, 'dist/mcp-server.mjs');

assertExists(dashServer, 'Run `npm run build` first (turbo build).');
assertExists(dashClient, 'Run `npm run build` first (turbo build).');
assertExists(mcpServer, 'Run `npm run bundle` first (bundles the MCP server).');

// 1. Fresh output dir
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 2. Bundle the CLI into a single self-contained file
const esbuild = loadEsbuild();

// Ink statically imports `react-devtools-core` (only used when DEV is set).
// Stub it so the production bundle does not need the dev-only dependency.
const stubReactDevtools = {
  name: 'stub-react-devtools-core',
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: 'react-devtools-core',
      namespace: 'stub-rdt',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-rdt' }, () => ({
      contents: 'export default {}; export const connectToDevTools = () => {};',
      loader: 'js',
    }));
  },
};

await esbuild.build({
  entryPoints: [resolve(ROOT, 'packages/cli/src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: resolve(OUT, 'cli.mjs'),
  external: ['fsevents'],
  plugins: [stubReactDevtools],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  // esbuild preserves the entry's shebang on line 1; the banner only adds the
  // createRequire shim some CJS deps need under ESM output.
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
});
chmodSync(resolve(OUT, 'cli.mjs'), 0o755);

// 3. Ship the dashboard server + its static client assets.
// The server resolves its client dir as `<serverDir>/../dist/client`, so we
// mirror the dev layout: server at dashboard/dist/server.mjs, assets alongside.
mkdirSync(resolve(OUT, 'dashboard/dist'), { recursive: true });
cpSync(dashServer, resolve(OUT, 'dashboard/dist/server.mjs'));
cpSync(dashClient, resolve(OUT, 'dashboard/dist/client'), { recursive: true });

// 4. Ship the bundled MCP server
mkdirSync(resolve(OUT, 'mcp'), { recursive: true });
cpSync(mcpServer, resolve(OUT, 'mcp/server.mjs'));

// 5. Generate the publishable package.json (no workspace deps — everything is inlined)
const outPkg = {
  name: PKG_NAME,
  version,
  description:
    'Standalone CLI + dashboard to manage your whole Claude Code setup: plugins, MCP servers, skills, commands, settings, profiles, sessions, and usage metrics.',
  type: 'module',
  bin: {
    'claude-config': './cli.mjs',
    'cc-config': './cli.mjs',
  },
  files: ['cli.mjs', 'dashboard', 'mcp', 'README.md'],
  engines: { node: '>=20' },
  keywords: [
    'claude',
    'claude-code',
    'cli',
    'mcp',
    'dashboard',
    'config',
    'configuration-manager',
  ],
  license: rootPkg.license || 'MIT',
  repository: rootPkg.repository || {
    type: 'git',
    url: 'https://github.com/wangcansunking/can-claude-plugins',
  },
  publishConfig: { access: 'public' },
};
writeFileSync(resolve(OUT, 'package.json'), JSON.stringify(outPkg, null, 2) + '\n');

// 6. README
const readme = resolve(ROOT, 'README.md');
if (existsSync(readme)) cpSync(readme, resolve(OUT, 'README.md'));

console.log(`\n✓ Standalone package assembled at ${OUT}`);
console.log(`  name:    ${PKG_NAME}@${version}`);
console.log(`  bins:    claude-config, cc-config`);
console.log(`  publish: npm publish ${OUT}\n`);
