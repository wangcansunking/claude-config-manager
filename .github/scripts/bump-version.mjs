#!/usr/bin/env node
/**
 * bump-version.mjs — invoked by .github/workflows/auto-bump.yml.
 *
 * Reads env:
 *   BUMP_LEVEL   patch | minor | major
 *   PR_NUMBER
 *   PR_TITLE
 *   PR_BODY      full body of the merged PR
 *   PR_URL       html_url of the PR
 *
 * Side effects (in the working tree):
 *   - Patches `.claude-plugin/plugin.json` version + every `package.json`
 *     under the repo (excluding node_modules).
 *   - Prepends a new `## [version] — date` block to CHANGELOG.md. Content
 *     comes from the first `## Changelog` section inside PR_BODY; if that's
 *     missing, falls back to a single bullet under a label-derived section.
 *
 * Writes to $GITHUB_OUTPUT:
 *   version=<new>
 *   plugin_name=<plugin.json name>
 */

import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const { BUMP_LEVEL, PR_NUMBER, PR_TITLE, PR_BODY, PR_URL, GITHUB_OUTPUT } = process.env;

if (!['patch', 'minor', 'major'].includes(BUMP_LEVEL ?? '')) {
  console.error(`Invalid BUMP_LEVEL: ${BUMP_LEVEL}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Read current version + plugin name from .claude-plugin/plugin.json
// ---------------------------------------------------------------------------

const pluginJson = JSON.parse(readFileSync('.claude-plugin/plugin.json', 'utf-8'));
const currentVersion = pluginJson.version;
const pluginName = pluginJson.name;

if (!currentVersion || !/^\d+\.\d+\.\d+/.test(currentVersion)) {
  console.error(`Unreadable current version: ${currentVersion}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Compute new version via semver bump
// ---------------------------------------------------------------------------

function bump(v, level) {
  const [maj, min, pat] = v.split('.').map((n) => parseInt(n, 10));
  switch (level) {
    case 'major':
      return `${maj + 1}.0.0`;
    case 'minor':
      return `${maj}.${min + 1}.0`;
    case 'patch':
      return `${maj}.${min}.${pat + 1}`;
  }
}

const newVersion = bump(currentVersion, BUMP_LEVEL);
console.log(`Bumping ${currentVersion} → ${newVersion} (${BUMP_LEVEL})`);

// ---------------------------------------------------------------------------
// 3. Patch every file that carries a version — plugin.json + all package.json
// ---------------------------------------------------------------------------

function listPackageJsons() {
  // `git ls-files` picks up tracked files only, which is exactly right —
  // we don't want to touch anything under node_modules/ or dist artifacts.
  const out = execSync('git ls-files "*package.json"', { encoding: 'utf-8' });
  return out.split('\n').filter((f) => f && !f.includes('node_modules'));
}

function patchVersion(path, expectedPrevVersion) {
  const raw = readFileSync(path, 'utf-8');
  // Keep formatting stable: only swap the version line.
  const re = /^(\s*"version"\s*:\s*")([^"]+)(")/m;
  const m = raw.match(re);
  if (!m) {
    console.warn(`  ${path} — no "version" field, skipping`);
    return false;
  }
  if (expectedPrevVersion && m[2] !== expectedPrevVersion) {
    console.warn(`  ${path} — version was ${m[2]}, expected ${expectedPrevVersion}; still bumping`);
  }
  const patched = raw.replace(re, `$1${newVersion}$3`);
  writeFileSync(path, patched);
  console.log(`  patched ${path}`);
  return true;
}

patchVersion('.claude-plugin/plugin.json', currentVersion);
for (const p of listPackageJsons()) {
  patchVersion(p);
}

// ---------------------------------------------------------------------------
// 4. Build the CHANGELOG block
// ---------------------------------------------------------------------------

function extractPrChangelogSection(body) {
  if (!body) return null;
  // Match a line that is literally "## Changelog" (case-insensitive),
  // then capture everything up to the next ## heading or EOF.
  const re = /(^|\n)##\s+Changelog\s*\n([\s\S]*?)(?=\n##\s+|$)/i;
  const m = body.match(re);
  return m ? m[2].trim() : null;
}

function fallbackEntryFromTitle(level, title) {
  const section =
    level === 'major' ? 'Breaking Changes' : level === 'minor' ? 'Added' : 'Fixed';
  return `### ${section}\n- ${title}`;
}

const today = new Date().toISOString().slice(0, 10);
const extracted = extractPrChangelogSection(PR_BODY ?? '');
const body = extracted ?? fallbackEntryFromTitle(BUMP_LEVEL, PR_TITLE ?? 'Release');
const prRef = `([#${PR_NUMBER}](${PR_URL}))`;

const entry = `## [${newVersion}] — ${today}

${body}

${prRef}
`;

// ---------------------------------------------------------------------------
// 5. Prepend entry to CHANGELOG.md (preserving the top banner)
// ---------------------------------------------------------------------------

function prependChangelog(entryBlock) {
  const path = 'CHANGELOG.md';
  let current = '';
  try {
    current = readFileSync(path, 'utf-8');
  } catch {
    current = '# Changelog\n\nAll notable changes to this project are documented here.\n';
  }
  // Find the first `## [` line — insert entry right before it.
  const headerMatch = current.match(/^(#\s+Changelog[\s\S]*?\n)(?=##\s+\[|$)/);
  const header = headerMatch
    ? headerMatch[1]
    : '# Changelog\n\nAll notable changes to this project are documented here.\n\n';
  const rest = current.slice(header.length);
  writeFileSync(path, `${header}\n${entryBlock}\n${rest.trimStart()}`);
  console.log(`  prepended entry to ${path}`);
}

prependChangelog(entry);

// ---------------------------------------------------------------------------
// 6. Export outputs for downstream steps
// ---------------------------------------------------------------------------

if (GITHUB_OUTPUT) {
  appendFileSync(GITHUB_OUTPUT, `version=${newVersion}\n`);
  appendFileSync(GITHUB_OUTPUT, `plugin_name=${pluginName}\n`);
}

console.log(`\nDone. New version: ${newVersion}`);
