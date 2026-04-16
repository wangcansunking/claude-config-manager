'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/shared/stat-card';
import { useMetrics } from '@/lib/use-data';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
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

// ---------------------------------------------------------------------------
// UsageBar — horizontal bar for a single entry
// ---------------------------------------------------------------------------

function UsageBar({
  entry,
  maxCount,
  barColor,
}: {
  entry: UsageEntry;
  maxCount: number;
  barColor: string;
}) {
  const pct = maxCount > 0 ? (entry.usageCount / maxCount) * 100 : 0;
  const relTime = formatRelativeTime(entry.lastUsedAt);

  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[#28282c]"
    >
      <span
        className="font-mono text-xs shrink-0"
        style={{ color: '#7170ff', width: '220px' }}
        title={entry.name}
      >
        {entry.name.length > 32 ? entry.name.slice(0, 30) + '...' : entry.name}
      </span>
      <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: '#0f1011' }}>
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
        className="text-xs font-medium shrink-0 text-right"
        style={{ color: '#d0d6e0', width: '48px' }}
      >
        {entry.usageCount}
      </span>
      {relTime && (
        <span
          className="text-xs shrink-0 text-right"
          style={{ color: '#8a8f98', width: '72px' }}
        >
          {relTime}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// UsageBarList — list of usage bars with a section header
// ---------------------------------------------------------------------------

function UsageBarList({
  title,
  entries,
  barColor,
  emptyMessage,
}: {
  title: string;
  entries: UsageEntry[];
  barColor: string;
  emptyMessage: string;
}) {
  const maxCount = entries.length > 0 ? entries[0].usageCount : 0;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255,0.05)' }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255,0.05)' }}
      >
        <h3
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: '#8a8f98' }}
        >
          {title}
        </h3>
      </div>
      {entries.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm" style={{ color: '#8a8f98' }}>{emptyMessage}</p>
        </div>
      ) : (
        <div className="py-1">
          {entries.map((entry) => (
            <UsageBar
              key={`${entry.category}-${entry.mcpServer ?? ''}-${entry.name}`}
              entry={entry}
              maxCount={maxCount}
              barColor={barColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// McpServerSection — collapsible section for one MCP server
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
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255,0.05)' }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#28282c]"
        style={{ borderBottom: open ? '1px solid rgba(255, 255, 255,0.05)' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-sm font-medium"
            style={{ color: '#d0d6e0' }}
          >
            {server}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255,0.05)', color: '#d0d6e0' }}
          >
            {totalCalls} calls
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255,0.05)', color: '#8a8f98' }}
          >
            {toolCount} tools
          </span>
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{
            color: '#8a8f98',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="py-1">
          {tools.map((tool) => (
            <UsageBar
              key={tool.name}
              entry={tool}
              maxCount={maxCount}
              barColor="#d0d6e0"
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

export default function MetricsPage() {
  const { data: metricsRaw, isLoading } = useMetrics();
  const metrics = metricsRaw as MetricsData | undefined;

  const mostUsedTool = metrics?.topTools?.[0]?.name ?? '-';
  const mcpServersUsed = metrics?.mcpServerBreakdown?.length ?? 0;

  // Group MCP tools by server for the breakdown section
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
      <Header
        title="Usage Metrics"
        subtitle={
          !isLoading && metrics
            ? `${metrics.totalToolCalls.toLocaleString()} tool calls, ${metrics.totalSkillCalls.toLocaleString()} skill calls`
            : 'Loading metrics...'
        }
      />

      {isLoading ? (
        <p style={{ color: '#d0d6e0' }}>Loading...</p>
      ) : !metrics ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255,0.05)' }}
        >
          <p className="text-lg mb-2" style={{ color: '#8a8f98' }}>
            No metrics available
          </p>
          <p className="text-sm" style={{ color: '#62666d' }}>
            Usage data will appear here once Claude tools and skills have been used.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Tool Calls"
              value={metrics.totalToolCalls.toLocaleString()}
              color="blue"
            />
            <StatCard
              title="Total Skill Calls"
              value={metrics.totalSkillCalls.toLocaleString()}
              color="purple"
            />
            <StatCard
              title="MCP Servers Used"
              value={mcpServersUsed}
              color="orange"
            />
            <StatCard
              title="Most Used Tool"
              value={mostUsedTool}
              color="green"
            />
          </div>

          {/* Two-column layout: Skills + Built-in Tools */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <UsageBarList
              title="Top Skills"
              entries={metrics.topSkills}
              barColor="#5e6ad2"
              emptyMessage="No skills have been used yet."
            />
            <UsageBarList
              title="Top Built-in Tools"
              entries={metrics.builtinTools}
              barColor="#5e6ad2"
              emptyMessage="No built-in tools have been used yet."
            />
          </div>

          {/* Full-width: All Skills (if more than top 5) */}
          {metrics.skills.length > 5 && (
            <div className="mb-8">
              <UsageBarList
                title="All Skills"
                entries={metrics.skills}
                barColor="#5e6ad2"
                emptyMessage="No skills have been used yet."
              />
            </div>
          )}

          {/* Full-width: MCP Server Breakdown */}
          {metrics.mcpServerBreakdown.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-lg font-medium mb-3"
                style={{ color: '#f7f8f8' }}
              >
                MCP Server Breakdown
              </h2>
              <div className="space-y-3">
                {metrics.mcpServerBreakdown.map((serverInfo) => (
                  <McpServerSection
                    key={serverInfo.server}
                    server={serverInfo.server}
                    tools={mcpToolsByServer[serverInfo.server] ?? []}
                    totalCalls={serverInfo.totalCalls}
                    toolCount={serverInfo.toolCount}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
