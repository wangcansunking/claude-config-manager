#!/usr/bin/env node
/**
 * bump-marketplace.mjs — invoked by .github/workflows/auto-bump.yml.
 *
 * Clones the marketplace repo (can-claude-plugins), updates this plugin's
 * version entry in .claude-plugin/marketplace.json and README.md, then pushes
 * the bump straight to main. Authentication is via GH_PAT_MARKETPLACE (a
 * fine-grained PAT that needs contents:write scoped to the marketplace repo).
 *
 * Skips silently (exit 0) if the PAT is absent — the workflow sets that as
 * a guard so forks / env misconfigs don't fail the whole run.
 *
 * Reads env:
 *   MARKETPLACE_PAT   fine-grained PAT for the marketplace repo
 *   MARKETPLACE_REPO  `<owner>/<name>` — default wangcansunking/can-claude-plugins
 *   NEW_VERSION       version to stamp into the marketplace
 *   PLUGIN_NAME       plugin name (matches the `name` field in marketplace.json)
 *   PR_URL            html_url of the source-plugin PR (referenced in commit body)
 */

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const {
  MARKETPLACE_PAT,
  MARKETPLACE_REPO = 'wangcansunking/can-claude-plugins',
  NEW_VERSION,
  PLUGIN_NAME,
  PR_URL,
} = process.env;

if (!MARKETPLACE_PAT) {
  console.log('GH_PAT_MARKETPLACE not set — skipping cross-repo bump.');
  process.exit(0);
}
if (!NEW_VERSION || !PLUGIN_NAME) {
  console.error('Missing NEW_VERSION or PLUGIN_NAME.');
  process.exit(1);
}

function sh(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf-8', ...opts }).trim();
}

// ---------------------------------------------------------------------------
// 1. Clone the marketplace repo into a tempdir using the PAT
// ---------------------------------------------------------------------------

const workDir = mkdtempSync(join(tmpdir(), 'ccm-marketplace-'));
const cloneUrl = `https://x-access-token:${MARKETPLACE_PAT}@github.com/${MARKETPLACE_REPO}.git`;
sh(`git clone --depth=20 ${cloneUrl} ${workDir}`);
process.chdir(workDir);

sh('git config user.name  "ccm-release-bot"');
sh('git config user.email "actions@github.com"');

// ---------------------------------------------------------------------------
// 2. Patch .claude-plugin/marketplace.json — find entry by name, bump version
// ---------------------------------------------------------------------------

const marketplaceJsonPath = '.claude-plugin/marketplace.json';
const manifest = JSON.parse(readFileSync(marketplaceJsonPath, 'utf-8'));
const entry = (manifest.plugins ?? []).find((p) => p.name === PLUGIN_NAME);
if (!entry) {
  console.error(`Plugin "${PLUGIN_NAME}" not found in marketplace manifest.`);
  process.exit(1);
}
const oldVersion = entry.version;
entry.version = NEW_VERSION;
writeFileSync(marketplaceJsonPath, JSON.stringify(manifest, null, 2) + '\n');

// ---------------------------------------------------------------------------
// 3. Patch README.md — find the table row for this plugin, bump trailing version
// ---------------------------------------------------------------------------

// Match a row like: | [plugin-name](url) | description | X.Y.Z |
// (Description column may be Chinese or English — the regex doesn't care.)
const rowRe = new RegExp(
  `(^\\|\\s*\\[${PLUGIN_NAME}\\][^|]*\\|[^|]*\\|\\s*)${oldVersion.replace(/\./g, '\\.')}(\\s*\\|\\s*$)`,
  'm',
);
for (const readmePath of ['README.md', 'README.zh.md']) {
  try {
    const readme = readFileSync(readmePath, 'utf-8');
    if (rowRe.test(readme)) {
      writeFileSync(readmePath, readme.replace(rowRe, `$1${NEW_VERSION}$2`));
      console.log(`Patched ${readmePath} table row.`);
    } else {
      console.warn(`Could not find ${readmePath} table row for this plugin — skipping.`);
    }
  } catch {
    console.warn(`${readmePath} not found — skipping.`);
  }
}

// ---------------------------------------------------------------------------
// 4. Commit + push directly to main
//
// We push straight to main (no PR) because:
//   - the bump is mechanical (a version field + README row, mirroring a
//     commit that already shipped in the plugin repo)
//   - mirror PRs were sitting OPEN for days, leaving marketplace stale
//   - the plugin repo's own auto-bump pushes its release commit straight to
//     master too — going via PR here was inconsistent with that
// ---------------------------------------------------------------------------

const status = sh('git status --porcelain');
if (!status) {
  console.log('No changes after patch — marketplace may already be at this version. Exiting.');
  process.exit(0);
}

sh('git add -A');
sh(
  `git commit -m "chore: bump ${PLUGIN_NAME} to ${NEW_VERSION}" -m "Mirrors ${PR_URL}"`,
);
sh('git push origin HEAD:main');

console.log(`Pushed marketplace bump for ${PLUGIN_NAME} ${oldVersion} → ${NEW_VERSION}.`);
