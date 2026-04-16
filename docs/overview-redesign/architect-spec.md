# Overview Page Redesign — Architecture Spec

## 1. Component Tree

```
OverviewPage
├── Header (existing — title="Overview")
├── StatsRow
│   └── StatCard x5 (existing)
├── div.grid-cols-2 (top row)
│   ├── RecentActivityList          ← NEW
│   └── EnvironmentHealth           ← NEW
├── QuickActions                    ← NEW
├── div.grid-cols-2 (usage row)
│   ├── UsageChart (skills)         ← NEW (replaces UsageBarList)
│   └── UsageChart (built-in tools) ← NEW (replaces UsageBarList)
└── McpServerBreakdown (extracted from current page.tsx)
    └── McpServerSection x N (existing inline component, extract to file)
```

## 2. Data Flow

| Component            | SWR Hook        | Data Used                                      |
|----------------------|-----------------|-------------------------------------------------|
| StatsRow             | `useStats()`    | `plugins, mcpServers, skills, profiles, sessions` |
| RecentActivityList   | `useSessions()` | Last 5 sessions sorted by `startedAt` desc      |
| EnvironmentHealth    | `usePlugins()` + `useMcpServers()` | Plugin `enabled`/version, MCP server status |
| UsageChart (skills)  | `useMetrics()`  | `topSkills` (first 8)                           |
| UsageChart (tools)   | `useMetrics()`  | `builtinTools` (first 8)                        |
| McpServerBreakdown   | `useMetrics()`  | `mcpServerBreakdown`, `mcpTools`                |
| QuickActions         | none            | Static links with `useRouter()`                 |

Each SWR hook is called once at `OverviewPage` level and results are passed as props. No child component calls a hook directly — this gives us a single dedup boundary and avoids waterfall fetches.

## 3. New Components

### 3.1 RecentActivityList

**Purpose:** Show last 5 sessions with status dot, cwd, and relative time.

```ts
// src/components/overview/recent-activity-list.tsx
interface RecentActivityListProps {
  sessions: SessionSummary[];
  isLoading: boolean;
}

interface SessionSummary {
  sessionId: string;
  cwd: string;
  startedAt: number;
  alive: boolean;
  lastMessage?: string;
  ide?: { name: string };
}
```

Renders a card with section header "Recent Activity". Each row: status dot, truncated cwd, relative time, optional IDE tag. Clicking a row navigates to `/sessions` (no detail panel on overview).

### 3.2 EnvironmentHealth

**Purpose:** Surface issues — disabled plugins, disconnected MCP servers.

```ts
// src/components/overview/environment-health.tsx
interface EnvironmentHealthProps {
  plugins: PluginHealthItem[];
  mcpServers: McpHealthItem[];
  isLoading: boolean;
}

interface PluginHealthItem {
  name: string;
  enabled: boolean;
}

interface McpHealthItem {
  name: string;
  status: 'connected' | 'disconnected' | 'pending';
}
```

Renders a card with "Environment Health" header. Shows a green checkmark when all healthy, otherwise lists issues (e.g., "2 plugins disabled", "1 MCP server disconnected") with StatusBadge. Empty state: "All systems healthy".

### 3.3 QuickActions

**Purpose:** One-click navigation to common tasks.

```ts
// src/components/overview/quick-actions.tsx
interface QuickAction {
  label: string;
  icon: string;
  href: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];  // override defaults for testing
}
```

Default actions:
- "Add Plugin" -> `/plugins`
- "Add MCP Server" -> `/mcp-servers`
- "Create Profile" -> `/profiles`
- "View Sessions" -> `/sessions`

Renders as a horizontal row of ghost-style Button components wrapped in `Link`. Full width, spaced evenly.

### 3.4 UsageChart

**Purpose:** Reusable horizontal bar chart replacing inline `UsageBarList`.

```ts
// src/components/shared/usage-chart.tsx
interface UsageChartEntry {
  name: string;
  value: number;
  lastUsedAt?: number;
}

interface UsageChartProps {
  title: string;
  entries: UsageChartEntry[];
  barColor: string;
  maxItems?: number;       // default 8
  emptyMessage?: string;
}
```

This extracts and generalizes the existing `UsageBarList`+`UsageBar` pattern from both `page.tsx` and `metrics/page.tsx`. Both pages reuse this single component. Internally renders `UsageBar` rows (same visual, moved into this file as a private component).

### 3.5 McpServerBreakdown (extracted)

```ts
// src/components/overview/mcp-server-breakdown.tsx
interface McpServerBreakdownProps {
  breakdown: { server: string; toolCount: number; totalCalls: number }[];
  toolsByServer: Record<string, UsageChartEntry[]>;
}
```

Wraps the existing `McpServerSection` collapsible pattern. Uses `UsageChart` internally.

## 4. File Structure

```
src/components/
├── overview/
│   ├── recent-activity-list.tsx   ← NEW
│   ├── environment-health.tsx     ← NEW
│   ├── quick-actions.tsx          ← NEW
│   └── mcp-server-breakdown.tsx   ← NEW (extracted from page.tsx)
├── shared/
│   ├── stat-card.tsx              (existing, unchanged)
│   ├── usage-chart.tsx            ← NEW (replaces inline UsageBarList)
│   ├── status-badge.tsx           (existing, reused by EnvironmentHealth)
│   ├── button.tsx                 (existing, reused by QuickActions)
│   └── ...
src/app/
├── page.tsx                       ← REWRITTEN (overview)
├── metrics/page.tsx               ← SIMPLIFIED (imports UsageChart, removes dupe code)
src/lib/
├── format-time.ts                 ← NEW (extract shared formatRelativeTime)
├── use-data.ts                    (unchanged)
├── api-client.ts                  (unchanged)
```

**Note:** `formatRelativeTime` is currently duplicated in `page.tsx`, `metrics/page.tsx`, and `sessions/page.tsx`. Extract to `src/lib/format-time.ts` and import everywhere.

## 5. Revised OverviewPage (page.tsx)

```ts
export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: metrics, isLoading: metricsLoading } = useMetrics();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: plugins, isLoading: pluginsLoading } = usePlugins();
  const { data: mcpServers, isLoading: mcpLoading } = useMcpServers();

  const loading = statsLoading || metricsLoading;

  // Derive props at page level, pass down
  const recentSessions = deriveRecentSessions(sessions, 5);
  const healthItems = deriveHealthItems(plugins, mcpServers);
  const mcpToolsByServer = groupMcpToolsByServer(metrics?.mcpTools);

  return (
    <div>
      <Header title="Overview" />
      {/* Stats */}
      {/* RecentActivityList + EnvironmentHealth (2-col) */}
      {/* QuickActions */}
      {/* UsageChart x2 (2-col) */}
      {/* McpServerBreakdown */}
    </div>
  );
}
```

## 6. Performance Strategy

| Concern | Approach |
|---------|----------|
| **SWR dedup** | Existing `dedupingInterval: 5000` in `swrConfig` prevents duplicate fetches within 5s. Keep as-is. |
| **Parallel fetches** | All 5 hooks fire concurrently at page level. No waterfall. |
| **Partial loading** | Show StatCard skeletons immediately. Render RecentActivityList and EnvironmentHealth with their own `isLoading` props so they show independently when their data arrives. |
| **Re-render isolation** | Each section is its own component with typed props. Use `React.memo` on `UsageChart` and `RecentActivityList` since their inputs change infrequently. |
| **No layout shift** | Give cards fixed min-heights: StatsRow `h-[100px]`, chart sections `min-h-[200px]`. |
| **MCP tool grouping** | Compute `mcpToolsByServer` with `useMemo` at page level, keyed on `metrics`. |

## 7. Responsive Layout

```
/* Stats row */
grid-cols-2 sm:grid-cols-3 lg:grid-cols-5   gap-4  mb-6

/* Activity + Health row */
grid-cols-1 lg:grid-cols-2                   gap-6  mb-6

/* Quick actions */
flex flex-wrap                               gap-3  mb-6

/* Usage charts row */
grid-cols-1 lg:grid-cols-2                   gap-6  mb-6

/* MCP breakdown */
full-width                                          mb-6
```

Breakpoints follow Tailwind defaults: `sm: 640px`, `lg: 1024px`. The sidebar is fixed 240px, so the content area starts at ~400px on smallest supported width (no mobile layout needed — this is a desktop dashboard).

## 8. Migration Checklist

1. Create `src/lib/format-time.ts` — extract `formatRelativeTime`
2. Create `src/components/shared/usage-chart.tsx` — extract from metrics page
3. Create `src/components/overview/recent-activity-list.tsx`
4. Create `src/components/overview/environment-health.tsx`
5. Create `src/components/overview/quick-actions.tsx`
6. Create `src/components/overview/mcp-server-breakdown.tsx`
7. Rewrite `src/app/page.tsx` — compose new components
8. Refactor `src/app/metrics/page.tsx` — import `UsageChart` instead of inline
9. Refactor `src/app/sessions/page.tsx` — import `formatRelativeTime`
10. Remove `/metrics` from sidebar nav (merged into overview)
