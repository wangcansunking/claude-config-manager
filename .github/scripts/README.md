# Release automation

## `auto-bump.yml`

Triggered on every merged PR. Does nothing unless the PR carries exactly one of the labels:

| Label            | Bump  |
|------------------|-------|
| `release:patch`  | 1.1.0 → 1.1.1 |
| `release:minor`  | 1.1.0 → 1.2.0 |
| `release:major`  | 1.1.0 → 2.0.0 |

Multiple `release:*` labels → workflow fails (ambiguous); no label → workflow no-ops.

### What gets bumped locally

- `.claude-plugin/plugin.json` `version`
- Every `package.json` tracked by git (via `git ls-files`), excluding `node_modules`.

### How the CHANGELOG entry is composed

Preferred: add a `## Changelog` section anywhere in the PR body. Everything under it up to the next `## ` heading (or EOF) is pasted verbatim into CHANGELOG.md under the new version block.

```markdown
(any PR body…)

## Changelog

### Added
- Gist sync via `claude-config gist push/pull`

### Fixed
- Dashboard bind host defaults to `127.0.0.1`
```

Fallback if no `## Changelog` section: synthesize one bullet under a section derived from the label — `patch → Fixed`, `minor → Added`, `major → Breaking Changes` — using the PR title as the line.

Both paths end with a `([#N](url))` reference line linking back to the source PR.

### Companion marketplace PR

After pushing the local bump, if the repo has a `GH_PAT_MARKETPLACE` secret, `bump-marketplace.mjs` clones `wangcansunking/can-claude-plugins`, updates the plugin's entry in `marketplace.json` and README table, and opens a PR mirroring the version bump. Without the secret this step is a silent no-op.

#### Setting up `GH_PAT_MARKETPLACE`

1. github.com → your profile → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. Repository access: only `wangcansunking/can-claude-plugins`
3. Permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
4. Save. Copy the token.
5. In this repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → name `GH_PAT_MARKETPLACE`, value the token.

## Files

- `.github/workflows/auto-bump.yml` — the workflow
- `.github/scripts/bump-version.mjs` — patches local files + CHANGELOG
- `.github/scripts/bump-marketplace.mjs` — cross-repo companion PR
