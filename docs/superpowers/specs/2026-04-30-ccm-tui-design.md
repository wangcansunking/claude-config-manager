# CCM TUI — Ink-Based Terminal UI for Claude Config Manager

**Date:** 2026-04-30
**Status:** Design approved, ready for implementation plan
**Scope:** v1 + v2 phasing for an in-CLI Ink-based TUI that mirrors the dashboard's
feature surface. Dashboard server kept, but becomes optional.

---

## 1. Goals & Constraints

- **Primary goal:** Make every dashboard operation reachable from the terminal
  without launching a browser. The TUI is the inline / fast path; the dashboard
  is the demo / shareable path.
- **Functional parity (except metrics charts):** Overview, Configuration
  (plugins / MCPs / skills / commands / settings), Profiles, Sessions,
  Recommended, Settings — all present in TUI. Charts stay in the dashboard.
- **Dashboard becomes optional:** TUI must work end-to-end with no port and no
  HTTP server. `claude-config start` (the dashboard) remains supported but is
  never required for TUI workflows.
- **Inline / fast feel:** Sub-250ms cold start, sub-16ms page jumps, no network.
- **Bilingual (zh / en):** TUI shares i18n resources with the dashboard.
- **Slash command split:**
  - `/ccm` — keeps its conversational dispatcher behavior; gains a one-line
    mention that interactive UI lives in `claude-config` (terminal).
  - `/ccm-dashboard` — unchanged (web demo path).

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       @ccm/cli                           │
│   src/index.ts                                           │
│   ├─ argv.length === 2  →  src/tui/runtime.ts            │
│   └─ subcommand         →  src/commands/*.ts (existing)  │
│                                                          │
│   src/tui/                                               │
│   ├─ runtime.ts    ← Ink render(), SIGINT, alt-buffer    │
│   ├─ App.tsx       ← <Sidebar/> + <MainPane/>            │
│   ├─ store.ts      ← zustand store                       │
│   ├─ pages/…                                             │
│   ├─ components/…                                        │
│   └─ hooks/                                              │
│      ├─ useWatcher.ts ← chokidar → store.refresh()       │
│      └─ useI18n.ts    ← from shared @ccm/core/i18n       │
└────────────────┬─────────────────────────────────────────┘
                 │  imports (no HTTP)
                 ▼
┌──────────────────────────────────────────────────────────┐
│                       @ccm/core                          │
│   managers/{plugin, mcp, skill-scanner, profile,         │
│             session, settings, marketplace, metrics,     │
│             recommendation}.ts        (already exists)   │
│   utils/{path-resolver, file-ops, cache}.ts              │
│   i18n/{en.json, zh.json, index.ts}    ← NEW (moved      │
│                                          from dashboard) │
└──────────────────────────────────────────────────────────┘
                 ▲
                 │  imports (unchanged)
                 │
┌────────────────┴─────────────────────────────────────────┐
│                    @ccm/dashboard                        │
│   server/routes/*.ts (existing thin wrappers)            │
│   client/i18n → re-export from @ccm/core/i18n            │
└──────────────────────────────────────────────────────────┘
```

**Key facts:**

- TUI does not depend on the dashboard. Dashboard still runs on the same
  `@ccm/core`.
- Single proactive refactor: move `dashboard/client/i18n/locales/{en,zh}.json`
  into `core/src/i18n/locales/`; the dashboard's `client/i18n/index.ts` re-exports
  from there. Behavior unchanged.
- New `@ccm/cli` dependencies: `ink`, `react`, `zustand`, `chokidar`,
  `ink-testing-library` (dev). Dashboard already pulls `chokidar`, so the npm
  cache is reused.
- Entry routing in `src/index.ts`: `if (process.argv.length === 2)
  renderTui()`. Subcommands (`profile`, `start`, `import`, `export`, `list`,
  `gist`, `mcp-server`) keep their current behavior — scripted workflows
  unaffected.

---

## 3. Layout & Global Keybindings

### Global frame

```
┌─ ccm 1.1.4 · zh · dashboard ●  (running) ────────────────────────────┐
│                                                                      │
│  ┌─────────────┐  ┌──────────────────────────────────────────────┐   │
│  │  Overview   │  │                                              │   │
│  │▶ Config     │  │             (active page content)            │   │
│  │  Profiles   │  │                                              │   │
│  │  Sessions   │  │                                              │   │
│  │  Recommend  │  │                                              │   │
│  │  Settings   │  │                                              │   │
│  └─────────────┘  └──────────────────────────────────────────────┘   │
│                                                                      │
│ j/k:nav  Enter:open  Tab:focus  /:filter  r:refresh  ?:help  q:quit  │
└──────────────────────────────────────────────────────────────────────┘
```

- **Header** (1 row): app name + version · current language · dashboard process status dot.
- **Sidebar** (~14 cols fixed): six top-level areas. `▶` marks the active page.
- **Main pane**: active page content. Border highlights when focused.
- **Footer** (1 row): keymap hints scoped to the current page.
- **Narrow terminal** (< 80 cols): sidebar collapses to a 1-col icon strip;
  main pane gets the rest.

### Global keybindings

| Key | Action |
|-----|--------|
| `1`–`6` | Jump to sidebar item N |
| `Tab` / `Shift+Tab` | Toggle focus between sidebar and main pane |
| `j` / `k` (or `↓` / `↑`) | List navigation |
| `g` / `G` | Top / bottom |
| `h` / `l` | Cycle inner tabs (only on Configuration page) |
| `Enter` | Activate / drill in |
| `Esc` | Back; no-op at top level |
| `/` | Filter current list |
| `r` | Force refresh (bypass watcher) |
| `?` | Help overlay |
| `q` / `Ctrl+C` | Quit (modal-aware: first press dismisses modal) |
| `:` | Command palette (deferred to v2) |

---

## 4. Screens

| # | Screen | Capabilities | v1 mutations | v2 mutations |
|---|--------|--------------|--------------|--------------|
| 1 | **Overview** | active profile · counts (plugin/MCP/skill) · 3 most recent sessions · dashboard status · disk usage | — | — |
| 2 | **Config › Plugins** | list (name, version, source, enabled) + detail (commands / skills / MCPs / README preview) | toggle enable/disable | install / uninstall (install via `/plugin install` hint) |
| 3 | **Config › MCPs** | list + detail (command, env, args) | toggle enabled, restart | add / remove / edit env |
| 4 | **Config › Skills** | list (source, scope) + detail (Skill.md preview) | toggle enable/disable | install / uninstall |
| 5 | **Config › Commands** | list slash commands + detail (md preview) | — | rename / delete |
| 6 | **Config › Settings** | settings.json key/value tree | toggle known booleans, change `model` via select | edit any field (with schema validation) |
| 7 | **Profiles** | list (name, active?, plugin/mcp/skill counts) | switch active profile | create / clone / export / import / delete |
| 8 | **Sessions** | list (project, branch, last-message time) + detail (messages preview) | copy resume id | rename / delete |
| 9 | **Recommended** | scrolling list grouped by MCP / Plugin / Skill (Top + Trending) | copy install command | — |
| 10 | **Settings** (TUI prefs) | language (zh/en) · theme (auto/dark/light) · quit-confirm toggle | applied immediately | — |

### Example screen — Config › Plugins

```
┌─ Config ─ plugins | MCPs | skills | commands | settings ────────────┐
│                                                                     │
│  Plugins (12 installed, 2 disabled)                       [/ filter]│
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │▶ vercel@claude-plugins-official     0.40.0   [✓] enabled    │    │
│  │  remember@claude-plugins-official   0.6.0    [✓] enabled    │    │
│  │  superpowers@claude-plugins-official 5.0.7   [✓] enabled    │    │
│  │  …                                                          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─ Detail ────────────────────────────────────────────────────┐    │
│  │ 8 commands · 3 skills · 1 MCP server                        │    │
│  │ Source: claude-plugins-official @ 3fe23669                  │    │
│  │ README (preview):                                           │    │
│  │   # vercel                                                  │    │
│  │   AI architecture, deployment, performance helpers...       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│ space:toggle  enter:detail  /:filter  d:disable-all  ?:help         │
└─────────────────────────────────────────────────────────────────────┘
```

### Shared components (`src/tui/components/`)

| Component | Purpose |
|-----------|---------|
| `<Header/>` | Top bar |
| `<Sidebar/>` | 6-region menu + selection state |
| `<MainPane/>` | Outlet for active page |
| `<Footer/>` | Contextual keymap hint, subscribes to current page |
| `<List/>` | Generic list: select, filter, scroll, `onSelect` |
| `<DetailPane/>` | Title + key/value rows + Markdown preview |
| `<ConfirmModal/>` | Destructive op confirmation (`Enter`/`Esc`) |
| `<Toast/>` | 3-second self-dismissing message |
| `<HelpOverlay/>` | `?` opens; lists current page keymap |
| `<MarkdownPreview/>` | Markdown renderer, scrollable, 200KB truncation cap |
| `<EmptyState/>` | Placeholder for empty lists |

---

## 5. Data Flow & State Management

### Store shape (zustand)

```ts
// packages/cli/src/tui/store.ts
type Store = {
  // —— data ————————————————————————————————
  plugins:          PluginRecord[];
  mcpServers:       McpServerRecord[];
  skills:           SkillRecord[];
  commands:         CommandRecord[];
  settings:         ClaudeSettings;
  profiles:         ProfileRecord[];
  sessions:         SessionRecord[];
  recommendations:  RecommendationRecord[];   // lazy-loaded
  dashboardStatus:  { running: boolean; pid?: number; port?: number };

  // —— UI state ——————————————————————————————
  activePage:       PageId;
  innerTab:         string | null;
  focused:          'sidebar' | 'main';
  pendingActions:   Set<string>;              // 'plugin:vercel', 'profile:switch:work'
  toasts:           Toast[];
  modal:            ModalDescriptor | null;
  loading:          Partial<Record<Section, boolean>>;
  lastError:        { section: Section; err: Error } | null;

  // —— actions ——————————————————————————————
  init():                       Promise<void>;
  refresh(section?: Section):   Promise<void>;
  togglePlugin(name):           Promise<void>;
  toggleMcp(name):              Promise<void>;
  toggleSkill(id):              Promise<void>;
  switchProfile(name):          Promise<void>;
  setLanguage(lang):            Promise<void>;
  // …more mutations
};
```

Types reuse `@ccm/types` — same source of truth as the dashboard server.

### Three pipelines

```
                     ┌───────────────────────────────────┐
                     │   ① init() / page enter           │
                     │   user mutation → ② mutate        │
                     │   external file write → ③ watcher │
                     └───────────────┬───────────────────┘
                                     │
   ┌─────────────────┬───────────────┼─────────────────┐
   ▼                 ▼               ▼                 ▼
  store           store           store              store
  setLoading      setOptimistic   setLoading         (just refresh)
   │                 │               │                 │
   ▼                 ▼               ▼                 ▼
 @ccm/core       @ccm/core       @ccm/core         @ccm/core
 .list*()        .toggle*()      .list*()          .list*()
   │                 │               │                 │
   ▼                 ▼               ▼                 ▼
  store           writes file     store             store
  setData         then watcher    setData           setData
                  fires (③)       (replace)         (replace)
                     │
                     ▼
                  store
                  setData
                  unsetPending
                  toast("saved")
```

### ① Initialization

```ts
async init() {
  set({ loading: allSectionsTrue });
  const [plugins, mcps, skills, commands, settings,
         profiles, sessions, dashboardStatus] = await Promise.all([
    PluginManager.list(),
    McpManager.list(),
    SkillScanner.scanSkills(),
    SkillScanner.scanCommands(),
    ConfigManager.read(),
    ProfileManager.list(),
    SessionManager.listRecent(50),
    detectDashboard(),
  ]);
  set({ plugins, mcpServers: mcps, skills, commands, settings,
        profiles, sessions, dashboardStatus, loading: {} });
  setupWatcher();
}
```

- Recommendations load lazily on first entry to that page.
- All sections fetched in parallel; the slowest (`SessionScanner`) is < 200 ms.
- Footer shows a spinner during init; clears when done.

### ② Mutation pattern (toggle plugin example)

```ts
async togglePlugin(name) {
  const cur = get().plugins.find(p => p.name === name);
  const next = !cur.enabled;
  // optimistic
  set(s => ({
    plugins: s.plugins.map(p =>
      p.name === name ? { ...p, enabled: next } : p),
    pendingActions: new Set(s.pendingActions).add(`plugin:${name}`),
  }));
  try {
    await PluginManager.setEnabled(name, next);
    toast(`${next ? 'Enabled' : 'Disabled'} ${name}`);
  } catch (err) {
    // revert
    set(s => ({
      plugins: s.plugins.map(p =>
        p.name === name ? { ...p, enabled: cur.enabled } : p),
      lastError: { section: 'plugins', err },
    }));
    toast.error(`Failed: ${err.message}`);
  } finally {
    set(s => {
      const n = new Set(s.pendingActions);
      n.delete(`plugin:${name}`);
      return { pendingActions: n };
    });
  }
}
```

Per-row spinner is gated by `pendingActions.has(\`plugin:${name}\`)`.

### ③ Watcher (chokidar)

```ts
function setupWatcher() {
  const home = homedir();
  const watcher = chokidar.watch([
    join(home, '.claude/settings.json'),
    join(home, '.claude/settings.local.json'),
    join(home, '.claude/.mcp.json'),
    join(home, '.claude.json'),                     // top-level mcpServers
    join(home, '.claude/plugins/installed_plugins.json'),
    join(home, '.claude/skills'),
    join(home, '.claude/profiles'),
    join(process.cwd(), '.claude'),                 // project-scope
  ], { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 100 } });

  const handle = debounce((path) => {
    const section = sectionOf(path);                // map path → Section
    refresh(section).catch(/* swallow; lastError already set */);
  }, 150);

  watcher.on('all', handle);
}
```

- `ignoreInitial: true` — init already read everything.
- `awaitWriteFinish` 100 ms — coalesces editor fsync bursts.
- Outer `debounce 150 ms` — collapses our own mutation writes (already handled
  optimistically in ②) plus any external follow-up.
- After our own mutation, the watcher-driven refetch matches the optimistic
  state → zustand shallow-compares → no re-render.

### Cross-cutting flows

- **Language switch:** `setLanguage('en')` → write `~/.claude/settings.json`
  → watcher fires → store re-reads settings → `useI18n` sees language change
  → `i18next.changeLanguage()` re-renders.
- **Theme switch:** Same flow via terminal palette.

### Recommendations

- **Source:** `~/.claude/plugins/ccm-cache/recommendations.json` (already used
  by the dashboard).
- **TUI behavior:** `fs.readFile()` on page entry; render the array.
- **Empty / missing:** `<EmptyState>` with hint: "Run `/ccm-recommendations`
  in Claude Code to generate."
- TUI does **not** invoke an LLM; the 60 recommendations are produced by the
  skill running inside a Claude Code session.

### Performance budget

| Operation | Target |
|-----------|--------|
| Cold start to first interactive frame | < 250 ms |
| Sidebar page jump | < 16 ms |
| Toggle plugin (optimistic visible) | < 50 ms |
| Watcher → re-render | < 100 ms |

---

## 6. Error Handling & Edge Cases

### Severity tiers

| Severity | Examples | Handling |
|----------|----------|----------|
| **Recoverable per-action** | `setEnabled` write fails, profile switch fails | Optimistic revert + red toast with `err.message`. UI stays usable. |
| **Section degraded** | Corrupt session jsonl, empty `recommendations.json` | That section renders `<EmptyState/>` with cause + remedy. Other sections unaffected. |
| **Settings unparseable** | `~/.claude/settings.json` JSON broken | Header shows red bar `Settings unreadable: line 12`, with `[r] reload` and `[o] open in $EDITOR` actions. Settings/Profiles/etc. become read-only with explanation. |
| **TUI bootstrap fails** | Non-TTY stdin, terminal too small, Ink render failure | Print error to stderr, exit 1, suggest subcommand fallback. |
| **Crash** (uncaught) | render throws, watcher throws, SDK throws | Global `process.on('uncaughtException')` restores alt buffer, prints stack + path to `installed_plugins.json` for issue reports. |

### Specific edge cases

| Scenario | Handling |
|----------|----------|
| Terminal < 60×15 | Full-screen "Resize and press any key" overlay; `process.stdout.on('resize')` recovers. |
| Resize ≥ minimum | Re-layout; sidebar < 80 cols shrinks to 1-col icon strip. |
| Non-TTY stdin | Refuse to launch; print `claude-config requires a TTY. Use subcommands for scripted workflows: claude-config --help`. |
| Second Ctrl+C | First press during a modal cancels it; double press within 250 ms exits. |
| User hand-edits a file then returns to TUI | Watcher fires refresh; conflicting open modal auto-dismisses with a toast. |
| Manager finds no file (fresh `~/.claude/`) | Returns empty array; `<EmptyState/>`. Not an error. |
| Dashboard status check fails | Header shows `dashboard: ?` (not red ●). Other features unaffected. |
| Recommendations cache missing | EmptyState explains how to generate it. |
| i18n key missing | i18next falls back to en; dev mode warns, prod silent. |
| chokidar fails to start (e.g., ENOSPC) | Degrade to manual `r` refresh; header shows `watch: off`. |
| Two TUI instances simultaneously | Both work; last write wins; no locking (matches dashboard). |
| Profile switch fails halfway | `ProfileManager.switch()` does atomic write (tmp + rename); original untouched on failure. TUI shows toast. |
| Markdown / README extremely long | `<MarkdownPreview>` scrolls; truncated past 200 KB; footer hint to open in $EDITOR. |

### Exit / cleanup

```ts
// runtime.ts
async function run() {
  const watcher = setupWatcher();
  const ink = render(<App/>);
  process.on('SIGINT',  () => gracefulExit(0));
  process.on('SIGTERM', () => gracefulExit(0));
  process.on('uncaughtException', (e) => {
    ink.unmount();
    console.error('\nccm tui crashed:', e);
    console.error('\nReport at https://github.com/wangcansunking/claude-config-manager/issues');
    process.exit(1);
  });
  async function gracefulExit(code) {
    await watcher.close().catch(() => {});
    ink.unmount();           // Ink restores alt buffer
    process.exit(code);
  }
  await ink.waitUntilExit();
}
```

### Explicit non-goals

- No file locking (dashboard doesn't lock either; concurrent multi-instance is a
  rare edge case).
- No auto-repair of corrupt JSON. Surface the error; user fixes in editor.
- No schema validation of arbitrary settings fields in v1; revisit in v2.
- No LLM calls inside the TUI. Recommendations come from the skill running in a
  Claude Code session.
- No support for `dumb` / non-ANSI terminals; detect early and refuse with a
  helpful message.

---

## 7. Testing Strategy

### Tooling

- **Vitest** (already used in the repo for both dashboard and cli).
- **ink-testing-library** — `render(<App/>)` exposes `lastFrame()` / `frames[]`
  and accepts simulated stdin.
- **node-pty** (E2E smoke tests only; ~2 cases).
- **memfs or `tmpdir + cleanup`** — sandbox the filesystem so tests never touch
  real `~/.claude`.

### Pyramid

```
                ┌─────────┐
                │  E2E    │   2 cases: launch binary, navigate, exit
                ├─────────┤
                │ Pages   │   1–3 per page: render with mocked data
                ├─────────┤
                │Components│   List / ConfirmModal / Sidebar / etc.
                ├─────────┤
                │  Store  │   action unit tests: init / mutate / watcher
                └─────────┘
```

### 1. Store unit tests (largest tier, highest value)

`src/tui/__tests__/store.test.ts`

| Case | Assertion |
|------|-----------|
| `init()` parallel load | All eight init calls fire concurrently; store fields = each manager's return value. |
| `togglePlugin` success | Optimistic update visible immediately; toast appears post-await; pending cleared. |
| `togglePlugin` failure | Optimistic reverted; lastError set; error toast shown. |
| Watcher fires | File change → `store.refresh(section)` invoked (within debounce). |
| Watcher matches own mutation | No second re-render (shallow compare skips). |
| Concurrent mutations | `pendingActions` records and clears each independently. |
| Settings parse failure | `store.lastError` set; `store.settings` keeps last good value. |

Mock `@ccm/core` managers via `vi.mock()`. Watcher is a stub chokidar emitter.

### 2. Component tests

`src/tui/__tests__/components/*.test.tsx`

- `<List/>`: filter input, j/k navigation, EmptyState, scroll.
- `<ConfirmModal/>`: Enter triggers `onConfirm`, Esc triggers `onCancel`,
  captures Ctrl+C while open.
- `<Sidebar/>`: 1–6 jumps, focus border.
- `<HelpOverlay/>`: renders the current page's keymap.
- `<MarkdownPreview/>`: truncation, scrolling.

Render with `ink-testing-library`; assert `lastFrame()` includes expected text.

### 3. Page integration tests

`src/tui/__tests__/pages/*.test.tsx`

| Page | Key cases |
|------|-----------|
| Plugins | Render 12 plugins; filter `verc` narrows to 1; `space` toggles icon; disabled rows dim. |
| Profiles | Switching moves the active marker; Enter opens ConfirmModal. |
| Sessions | Render 50 entries; Enter opens detail; `y` copies resume id. |
| Recommended | Cache present → list; missing → EmptyState. |
| Config Settings | Change `model`; ConfirmModal commits; error reverts. |

Pages use a mocked store; they do not call real `@ccm/core` (covered in tier 1).

### 4. E2E smoke tests (small, slow)

`packages/cli/__tests__/tui.e2e.test.ts`

```ts
it('launches TUI, navigates to Profiles, exits cleanly', async () => {
  const pty = spawn('node', ['dist/index.js'], { /* … */ });
  await waitFor(() => pty.output.includes('Overview'));
  pty.write('3');                                // jump to Profiles
  await waitFor(() => pty.output.includes('Profiles'));
  pty.write('q');
  expect(await pty.exit).toBe(0);
});
```

Two or three cases:

1. Launch → default page → quit.
2. Launch → switch language → re-render → quit.
3. Piped stdin → refuse to launch + exit 1.

### Explicit non-goals

- No visual regression tests (terminal output is too sensitive to char width,
  locale, and Ink version changes).
- No real-filesystem writes; every test uses a tmpdir and overrides
  `process.env.CLAUDE_CONFIG_HOME`.
- No 100% coverage chase. Targets: store ≥ 90%, components ≥ 70%, pages ≥ 60%.
  E2E is smoke-only.

### CI

- Runs under existing `turbo test` pipeline; new `vitest.config.ts` lives in
  `packages/cli`.
- E2E runs on Linux + macOS runners (Windows TUI testing needs conpty
  adaptation; deferred).
- Performance benchmark is non-blocking — captured once per PR and pasted into
  the PR description.

---

## 8. Phased Delivery

- **v1** — All 10 screens browse-capable; high-frequency mutations only:
  - toggle plugin / MCP / skill enable/disable
  - profile switch
  - copy session resume id
  - copy recommendation install command
  - language / theme change
- **v2** — Heavy mutations:
  - profile create / clone / export / import / delete
  - settings field edit (with schema validation)
  - session rename / delete
  - plugin install / uninstall
  - command rename / delete
  - command palette (`:` keystroke)

Each phase ships as a single PR. The v1 PR includes the i18n move from
`@ccm/dashboard/client/i18n` into `@ccm/core/i18n`.

---

## 9. Open Items (deferred, not blocking)

- Windows testing (conpty) — defer to v2.
- Color / theme palette per-terminal (true-color vs 256-color detection) — Ink
  handles automatically via `chalk`; revisit if any user reports it.
- Accessibility — TUI inherits whatever the user's terminal exposes; no extra
  ARIA.
- Telemetry — none. `claude-config-manager` is a local tool.
