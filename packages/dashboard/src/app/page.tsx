'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/shared/stat-card';
import { UsageChart } from '@/components/overview/usage-chart';
import { RecentSessions } from '@/components/overview/recent-sessions';
import { EnvironmentHealth } from '@/components/overview/environment-health';
import { useStats, useMetrics } from '@/lib/use-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageEntry {
  name: string;
  usageCount: number;
  lastUsedAt: number;
  category: string;
  mcpServer?: string;
}

interface McpServerBreakdown {
  server: string;
  toolCount: number;
  totalCalls: number;
}

interface MetricsData {
  skills: UsageEntry[];
  builtinTools: UsageEntry[];
  mcpTools: UsageEntry[];
  totalToolCalls: number;
  totalSkillCalls: number;
  topTools: UsageEntry[];
  topSkills: UsageEntry[];
  mcpServerBreakdown: McpServerBreakdown[];
}

interface Stats {
  plugins: number;
  mcpServers: number;
  skills: number;
  profiles: number;
  sessions: number;
}

// ---------------------------------------------------------------------------
// UsageBar (used inside McpServerSection)
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function UsageBar({ entry, maxCount, barColor }: { entry: UsageEntry; maxCount: number; barColor: string }) {
  const pct = maxCount > 0 ? (entry.usageCount / maxCount) * 100 : 0;
  const relTime = formatRelativeTime(entry.lastUsedAt);
  return (
    <div className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-bg-hover">
      <span
        className="font-mono text-xs shrink-0"
        style={{ color: 'var(--accent-light)', width: '200px' }}
        title={entry.name}
      >
        {entry.name.length > 28 ? entry.name.slice(0, 26) + '...' : entry.name}
      </span>
      <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <div
          className="h-full rounded"
          style={{
            width: `${Math.max(pct, 2)}%`,
            backgroundColor: barColor,
            opacity: 0.85,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        className="text-xs shrink-0 text-right"
        style={{ color: 'var(--text-secondary)', width: '44px', fontWeight: 510 }}
      >
        {entry.usageCount}
      </span>
      {relTime && (
        <span
          className="text-xs shrink-0 text-right"
          style={{ color: 'var(--text-faint)', width: '64px' }}
        >
          {relTime}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// McpServerSection — collapsible per-server breakdown
// ---------------------------------------------------------------------------

function McpServerSection({
  server,
  tools,
  totalCalls,
  toolCount,
}: {
  server: string;
  tools: UsageEntry[];
  totalCalls: number;
  toolCount: number;
}) {
  const [open, setOpen] = useState(false);
  const maxCount = tools.length > 0 ? tools[0].usageCount : 0;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-bg-hover"
        style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)', fontWeight: 510 }}>
            {server}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            {totalCalls} calls
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {toolCount} tools
          </span>
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            color: 'var(--text-faint)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="py-1">
          {tools.map((tool) => (
            <UsageBar key={tool.name} entry={tool} maxCount={maxCount} barColor="var(--accent)" />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// McpUsageSection — full-width collapsible row 4
// ---------------------------------------------------------------------------

function McpUsageSection({
  metrics,
  mcpToolsByServer,
}: {
  metrics: MetricsData;
  mcpToolsByServer: Record<string, UsageEntry[]>;
}) {
  const [open, setOpen] = useState(true);

  if (metrics.mcpServerBreakdown.length === 0) return null;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-bg-hover"
        style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <h2 className="text-lg" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>MCP Server Usage</h2>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            color: 'var(--text-faint)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="p-5 space-y-3">
          {metrics.mcpServerBreakdown.map((info) => (
            <McpServerSection
              key={info.server}
              server={info.server}
              tools={mcpToolsByServer[info.server] ?? []}
              totalCalls={info.totalCalls}
              toolCount={info.toolCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: metricsRaw, isLoading: metricsLoading } = useMetrics();

  const loading = statsLoading || metricsLoading;
  const typedStats = stats as Stats | undefined;
  const metrics = metricsRaw as MetricsData | undefined;

  const mcpToolsByServer: Record<string, UsageEntry[]> = {};
  if (metrics?.mcpTools) {
    for (const tool of metrics.mcpTools) {
      const server = tool.mcpServer ?? 'unknown';
      if (!mcpToolsByServer[server]) mcpToolsByServer[server] = [];
      mcpToolsByServer[server].push(tool);
    }
  }

  return (
    <div>
      <Header title="Overview" />

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Quick Stats — 5 cards */}
          <div className="grid grid-cols-5 gap-4">
            <StatCard title="Plugins"     value={typedStats?.plugins    ?? 0} color="purple" />
            <StatCard title="MCP Servers" value={typedStats?.mcpServers ?? 0} color="blue"   />
            <StatCard title="Skills"      value={typedStats?.skills     ?? 0} color="green"  />
            <StatCard title="Profiles"    value={typedStats?.profiles   ?? 0} color="orange" />
            <StatCard title="Sessions"    value={typedStats?.sessions   ?? 0} color="blue"   />
          </div>

          {/* Row 2: Usage Charts — Top Skills + Top Tools */}
          {metrics && (
            <div className="grid grid-cols-2 gap-6">
              <UsageChart
                title="Top Skills"
                entries={metrics.topSkills}
                barColor="var(--accent)"
                maxItems={8}
              />
              <UsageChart
                title="Top Tools"
                entries={metrics.topTools}
                barColor="var(--accent-light)"
                maxItems={8}
              />
            </div>
          )}

          {/* Row 3: Recent Sessions + Environment Health */}
          <div className="grid grid-cols-2 gap-6">
            <RecentSessions />
            <EnvironmentHealth />
          </div>

          {/* Row 4: MCP Usage — full width, collapsible */}
          {metrics && (
            <McpUsageSection metrics={metrics} mcpToolsByServer={mcpToolsByServer} />
          )}
        </div>
      )}
    </div>
  );
}
