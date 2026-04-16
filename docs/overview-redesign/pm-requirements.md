# Overview Page Redesign - Product Requirements

**Author:** PM  
**Date:** 2026-04-16  
**Status:** Draft  
**Dashboard:** claude-config-manager (`packages/dashboard`)

---

## Problem Statement

The current Overview page shows stats and usage charts but misses session activity, environment health, and quick actions. A power user opening the dashboard wants to answer three questions in under 5 seconds: "Is everything healthy?", "What happened recently?", and "What should I do next?" The current page answers none of these.

---

## User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| U1 | Power user | See counts of plugins, MCP servers, skills, profiles, and active sessions at a glance | I know the scale of my environment |
| U2 | Power user | See which sessions are running right now and what they last did | I can monitor active work across projects |
| U3 | Power user | See my most-used tools and skills | I understand my usage patterns and spot underused capabilities |
| U4 | Power user | Know if any MCP servers are disconnected or plugins disabled | I can fix problems before they block my work |
| U5 | Power user | Jump to common actions (export profile, open settings, browse MCP store) | I don't have to hunt through navigation for frequent tasks |
| U6 | New user | Understand what this dashboard manages | I feel oriented and know where to start |

---

## Information Hierarchy

**Tier 1 - Glanceable (top of page, no scrolling required):**
- Quick stats row
- Environment health alerts (only when there are issues)

**Tier 2 - Activity (first scroll):**
- Recent sessions (last 5)
- Top tools + skills usage bars

**Tier 3 - Convenience (below the fold):**
- Quick actions row
- MCP server usage summary

---

## Section Specifications

### 1. Quick Stats Row (existing, keep)

**Priority:** P0  
**Data source:** `useStats()` + `useSessions()`

Display 5 stat cards in a single row:
- Plugins (count) - links to `/plugins`
- MCP Servers (count) - links to `/mcp-servers`
- Skills (count) - links to `/skills`
- Profiles (count) - links to `/profiles`
- Active Sessions (count of alive sessions only, not total) - links to `/sessions`

**Change from current:** The "Sessions" stat currently shows total sessions. Change it to show only active (alive) sessions, since total count is less actionable. Display the total as a subtle subtitle (e.g., "1 active / 47 total").

### 2. Environment Health Alerts (new)

**Priority:** P0  
**Data source:** `useMcpServers()`, `usePlugins()`, `useSettings()`

A banner area that appears **only when there are issues**. When everything is healthy, this section is invisible (no "all clear" noise).

Conditions that trigger alerts:
- **Disconnected MCP servers:** Any server where `enabled === false` or connection is down
- **Disabled plugins:** Plugins that are installed but `enabled === false`
- **Missing model config:** Settings where `model` is empty/unset
- **No active profile:** Zero profiles exist, or none is marked active

Each alert is a single-line row with: severity icon, description, and a link to the relevant page to fix it. Example: "2 MCP servers disabled - View in MCP Servers"

**Interaction:** Clicking an alert navigates to the relevant detail page. Alerts are dismissible per-session (client-side state only; they reappear on refresh if the issue persists).

### 3. Recent Sessions (new)

**Priority:** P0  
**Data source:** `useSessions()`

Show the **5 most recent sessions** (sorted by `startedAt` descending), regardless of alive/terminated status.

Each session row displays:
- Status dot (green = alive, gray = terminated)
- Project directory (truncated to last 2 path segments for readability)
- Relative time ("3m ago", "2h ago")
- Last message (truncated to ~80 chars)
- IDE badge if present (e.g., "VS Code (websocket)")

**Interaction:**
- Clicking a session row navigates to `/sessions` with that session pre-selected (or opens the session slide panel)
- "View all sessions" link at the bottom navigates to `/sessions`

### 4. Usage Metrics (existing, modify)

**Priority:** P1  
**Data source:** `useMetrics()`

Keep the existing two-column layout but **limit to top 5 entries each** (currently shows all). The full list lives on `/metrics`.

- Left column: Top 5 Skills (purple bars)
- Right column: Top 5 Built-in Tools (blue bars)

**Changes from current:**
- Cap at 5 entries per list (the Overview is a summary, not the full metrics page)
- Add a "View all metrics" link below the charts that goes to `/metrics`
- Remove the MCP Server Usage breakdown from Overview (it's too detailed for a summary page; keep it on `/metrics` only)

### 5. Quick Actions (new)

**Priority:** P1  
**Data source:** Static/contextual

A row of action buttons for the most common tasks. Limit to 4-5 actions max.

Proposed actions:
- **Export Profile** - triggers profile export flow (same as `/profiles` export, for the active profile)
- **Open Settings** - navigates to `/settings`
- **Browse MCP Store** - navigates to `/mcp-servers` with MCP Store tab selected
- **Browse Plugins** - navigates to `/plugins` with Marketplace tab selected

**Interaction:** Each action is a button-style card. Actions that navigate should use client-side routing. Actions that trigger flows (export) open the relevant dialog/download directly.

---

## Sections Removed from Overview

| Section | Reason | New Location |
|---------|--------|-------------|
| MCP Server Breakdown (collapsible per-server tool lists) | Too detailed for a summary page | `/metrics` (already there) |
| Full tool/skill lists (all entries) | Overview should show top 5 only | `/metrics` |

---

## Interactions Summary

| Element | Click Behavior |
|---------|---------------|
| Stat card (Plugins) | Navigate to `/plugins` |
| Stat card (MCP Servers) | Navigate to `/mcp-servers` |
| Stat card (Skills) | Navigate to `/skills` |
| Stat card (Profiles) | Navigate to `/profiles` |
| Stat card (Sessions) | Navigate to `/sessions` |
| Health alert row | Navigate to relevant page (`/mcp-servers`, `/plugins`, `/settings`, `/profiles`) |
| Health alert dismiss (X) | Hide alert for current browser session |
| Session row | Navigate to `/sessions` (with session pre-selected) |
| "View all sessions" link | Navigate to `/sessions` |
| Usage bar (skill or tool) | No action (non-interactive on Overview; interactive on `/metrics`) |
| "View all metrics" link | Navigate to `/metrics` |
| Quick action button | Navigate or trigger action (see section 5) |

---

## Data Requirements

No new API endpoints needed. All data is available from existing hooks:

| Hook | Used For |
|------|----------|
| `useStats()` | Stat cards (plugins, mcpServers, skills, profiles counts) |
| `useSessions()` | Active session count, recent sessions list |
| `useMetrics()` | Top 5 skills, top 5 built-in tools |
| `useMcpServers()` | Health check: disabled/disconnected servers |
| `usePlugins()` | Health check: disabled plugins |
| `useSettings()` | Health check: model configuration, current model display |

**Performance note:** The Overview will call 6 hooks. All use SWR with `dedupingInterval: 5000` so data is shared with other pages and not re-fetched redundantly. Loading states should be handled per-section (progressive rendering), not as a single full-page loader.

---

## Success Criteria

1. **Time to insight:** A returning user can assess environment health + recent activity within 5 seconds of page load
2. **Zero dead-ends:** Every data point on the Overview links to its detail page
3. **No information overload:** The page fits in ~1.5 viewport heights at 1080p. No horizontal scrolling.
4. **Health signal accuracy:** If an MCP server is disabled or a plugin is off, the alert is always visible (no false negatives). If everything is fine, no alerts appear (no false positives).
5. **Load performance:** All sections render within 500ms on a warm cache. Progressive loading for cold start (stats first, then sessions, then metrics).

---

## Out of Scope

- Real-time session streaming (WebSocket updates for session activity)
- Usage trend charts over time (daily/weekly graphs)
- Customizable dashboard layout (drag-and-drop widgets)
- Notifications or toast system beyond health alerts
- Session management actions from Overview (stop/restart sessions)

---

## Open Questions

1. Should the active profile name and model be displayed prominently in the stats row or header area? The current model (`opus[1m]`) is useful context.
2. Should quick actions be contextual (e.g., show "Fix MCP" only when servers are down) or always static?
3. Should the health alerts section also check for plugin update availability, or is that too noisy for a v1?
