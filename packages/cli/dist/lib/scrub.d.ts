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
export declare const REDACTED = "<REDACTED>";
/**
 * Return a deep-cloned copy of `data` with secrets redacted.
 *
 * Never mutates the input.
 */
export declare function scrubSecrets(data: unknown): unknown;
export interface ResidualHit {
    path: string;
    match: string;
    patternName: string;
}
/**
 * After `scrubSecrets`, sweep the tree for string values that still match
 * known secret shapes. `gist push` uses this as a last-line-of-defense check.
 */
export declare function findResidualSecrets(data: unknown): ResidualHit[];
//# sourceMappingURL=scrub.d.ts.map