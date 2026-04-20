/**
 * Defensive secret scrubber for profile JSON destined for a public surface (Gist).
 *
 * Three layers:
 *   1. Key-name blacklist — any property whose key looks secret-bearing gets
 *      its value replaced with REDACTED, regardless of depth.
 *   2. `env` blanket-redact — every value under an `env` object is dropped,
 *      because environment variables are the single most common leak vector
 *      (users stash API keys there) and there's rarely a good reason to
 *      share them.
 *   3. Residual-pattern scan — after scrubbing, walk the result and flag any
 *      string values that still match known secret shapes (sk-, ghp_, long
 *      hex, JWT-ish). `push` refuses to upload when the scan finds anything.
 */

export const REDACTED = '<REDACTED>';

const SECRET_KEY_PATTERN =
  /key|token|password|secret|apikey|auth|bearer|credential|signature|private/i;

// Ordered most-specific-first so overlapping patterns (e.g. sk-ant-… would
// also match the generic sk-… rule) report under the more specific name.
// `sweep` stops at the first match per string.
const SECRET_VALUE_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: 'Anthropic API key', re: /\bsk-ant-[a-zA-Z0-9_\-]{20,}\b/ },
  { name: 'GitHub personal access token', re: /\bghp_[a-zA-Z0-9]{36,}\b/ },
  { name: 'GitHub fine-grained token', re: /\bgithub_pat_[a-zA-Z0-9_]{40,}\b/ },
  { name: 'AWS access key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_\-]{35}\b/ },
  // JWT: three base64 segments. Keep restrictive on length to avoid false positives.
  { name: 'JWT', re: /\beyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\b/ },
  // Generic sk- last so Anthropic's sk-ant- prefix wins above.
  { name: 'OpenAI-style API key', re: /\bsk-[a-zA-Z0-9_\-]{20,}\b/ },
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Return a deep-cloned copy of `data` with secrets redacted.
 *
 * Never mutates the input.
 */
export function scrubSecrets(data: unknown): unknown {
  return walk(data, []);
}

function walk(node: unknown, path: string[]): unknown {
  // `env` is aggressive — drop every value unconditionally.
  const parentIsEnv = path.length > 0 && path[path.length - 1] === 'env';

  if (isPlainObject(node)) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (parentIsEnv) {
        out[key] = REDACTED;
        continue;
      }
      if (SECRET_KEY_PATTERN.test(key)) {
        out[key] = REDACTED;
        continue;
      }
      out[key] = walk(value, [...path, key]);
    }
    return out;
  }

  if (Array.isArray(node)) {
    return node.map((item, i) => walk(item, [...path, String(i)]));
  }

  return node;
}

export interface ResidualHit {
  path: string;
  match: string;
  patternName: string;
}

/**
 * After `scrubSecrets`, sweep the tree for string values that still match
 * known secret shapes. `gist push` uses this as a last-line-of-defense check.
 */
export function findResidualSecrets(data: unknown): ResidualHit[] {
  const hits: ResidualHit[] = [];
  sweep(data, [], hits);
  return hits;
}

function sweep(node: unknown, path: string[], hits: ResidualHit[]): void {
  if (typeof node === 'string') {
    for (const { name, re } of SECRET_VALUE_PATTERNS) {
      const m = node.match(re);
      if (m) {
        hits.push({ path: path.join('.') || '(root)', match: m[0], patternName: name });
        break; // first match wins — patterns are ordered most-specific-first
      }
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => sweep(item, [...path, String(i)], hits));
    return;
  }
  if (isPlainObject(node)) {
    for (const [key, value] of Object.entries(node)) {
      sweep(value, [...path, key], hits);
    }
  }
}
