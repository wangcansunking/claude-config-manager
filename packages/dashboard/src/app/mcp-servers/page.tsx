'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { Button } from '@/components/shared/button';
import { Tag } from '@/components/shared/tag';
import { McpItem } from '@/components/mcp-list/mcp-item';
import type { McpServer } from '@/components/mcp-list/mcp-item';
import { fetchMcpServers, removeMcpServer } from '@/lib/api-client';

export default function McpServersPage() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<McpServer | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  async function loadServers() {
    try {
      const data = await fetchMcpServers();
      setServers(data as McpServer[]);
    } catch (err) {
      console.error('Failed to load MCP servers', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(name: string) {
    try {
      await removeMcpServer(name);
      setServers((prev) => prev.filter((s) => s.name !== name));
      setSelected(null);
    } catch (err) {
      console.error('Failed to remove MCP server', err);
    }
  }

  return (
    <div>
      <Header title="MCP Servers">
        <Button variant="primary" size="md">Add Server</Button>
      </Header>

      {loading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : servers.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
            No MCP servers configured. Click &ldquo;Add Server&rdquo; to get started.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          {servers.map((server) => (
            <McpItem
              key={server.name}
              server={server}
              onClick={() => setSelected(server)}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle="MCP Server"
        tags={selected ? [
          { label: selected.enabled !== false ? 'Connected' : 'Disabled', variant: selected.enabled !== false ? 'green' : 'red' },
        ] : []}
        actions={selected ? (
          <>
            <Button variant="secondary" size="sm">Edit Config</Button>
            <Button variant="secondary" size="sm">Restart</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleRemove(selected.name)}
            >
              Remove
            </Button>
          </>
        ) : undefined}
      >
        {selected && (
          <div className="space-y-5">
            {/* Connection config */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
                Connection Config
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-xs" style={{ color: '#636e72' }}>Command</span>
                  <code className="text-xs font-mono" style={{ color: '#a29bfe' }}>
                    {selected.config.command}
                  </code>
                </div>
                {selected.config.args && selected.config.args.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs" style={{ color: '#636e72' }}>Args</span>
                    <code className="text-xs font-mono text-right" style={{ color: '#b2bec3' }}>
                      {selected.config.args.join(' ')}
                    </code>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-xs" style={{ color: '#636e72' }}>Scope</span>
                  <span className="text-xs" style={{ color: '#b2bec3' }}>Global</span>
                </div>
              </div>
            </section>

            {/* Environment Variables */}
            {selected.config.env && Object.keys(selected.config.env).length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
                  Environment Variables
                </h3>
                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{ backgroundColor: '#16161d' }}
                >
                  {Object.entries(selected.config.env).map(([key]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <code className="text-xs font-mono" style={{ color: '#fdcb6e' }}>{key}</code>
                      <code className="text-xs font-mono" style={{ color: '#636e72' }}>••••••••</code>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tools placeholder */}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
                Tools Provided
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Tag label="Tools available when connected" variant="purple" />
              </div>
            </section>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
