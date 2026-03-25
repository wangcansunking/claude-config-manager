'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/shared/stat-card';
import { Tag } from '@/components/shared/tag';
import { Button } from '@/components/shared/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { fetchStats, fetchPlugins, fetchMcpServers } from '@/lib/api-client';

interface Plugin {
  name: string;
  version: string;
  marketplace: string;
  enabled: boolean;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface McpServer {
  name: string;
  config: McpServerConfig;
  enabled?: boolean;
}

interface Stats {
  plugins: number;
  mcpServers: number;
  skills: number;
  profiles: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, p, m] = await Promise.all([
          fetchStats(),
          fetchPlugins(),
          fetchMcpServers(),
        ]);
        setStats(s);
        setPlugins(p as Plugin[]);
        setMcpServers(m as McpServer[]);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <Header title="Overview">
        <Button variant="secondary" size="md">Export</Button>
        <Button variant="primary" size="md">Import</Button>
      </Header>

      {loading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard title="Plugins" value={stats?.plugins ?? 0} color="purple" />
            <StatCard title="MCP Servers" value={stats?.mcpServers ?? 0} color="blue" />
            <StatCard title="Skills" value={stats?.skills ?? 0} color="green" />
            <StatCard title="Profiles" value={stats?.profiles ?? 0} color="orange" />
          </div>

          {/* Installed Plugins */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>
              Installed Plugins
            </h2>
            {plugins.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                <p style={{ color: '#636e72' }}>No plugins installed.</p>
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                {plugins.slice(0, 5).map((plugin, i) => (
                  <div
                    key={plugin.name}
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                      borderBottom: i < Math.min(plugins.length, 5) - 1 ? '1px solid #2a2a35' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-sm" style={{ color: '#ffffff' }}>
                          {plugin.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag label={`v${plugin.version}`} variant="gray" />
                          <Tag label={plugin.marketplace} variant="blue" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button variant="secondary" size="sm">Update</Button>
                      <Button variant="danger" size="sm">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MCP Servers */}
          <div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#ffffff' }}>
              MCP Servers
            </h2>
            {mcpServers.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                <p style={{ color: '#636e72' }}>No MCP servers configured.</p>
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                {mcpServers.map((server, i) => (
                  <div
                    key={server.name}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{
                      borderBottom: i < mcpServers.length - 1 ? '1px solid #2a2a35' : 'none',
                    }}
                  >
                    <StatusBadge status="connected" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm" style={{ color: '#ffffff' }}>
                        {server.name}
                      </span>
                      <p
                        className="text-xs font-mono mt-0.5 truncate"
                        style={{ color: '#636e72' }}
                      >
                        {server.config.command}
                        {server.config.args && server.config.args.length > 0
                          ? ' ' + server.config.args.join(' ')
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
