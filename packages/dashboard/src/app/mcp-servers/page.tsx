'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { Button } from '@/components/shared/button';
import { Tag } from '@/components/shared/tag';
import { SearchBox } from '@/components/shared/search-box';
import { McpItem } from '@/components/mcp-list/mcp-item';
import type { McpServer } from '@/components/mcp-list/mcp-item';
import { removeMcpServer, searchMcpRegistry, installMcpFromRegistry } from '@/lib/api-client';
import { useMcpServers } from '@/lib/use-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface McpRegistryResult {
  name: string;
  description: string;
  source: 'mcp-registry' | 'npm' | 'smithery';
  version?: string;
  installCommand?: string;
  repositoryUrl?: string;
  npmUrl?: string;
  score?: number;
}

type SourceFilter = 'all' | 'mcp-registry' | 'npm' | 'smithery';

// ---------------------------------------------------------------------------
// CollapsibleSection (unchanged)
// ---------------------------------------------------------------------------

function CollapsibleSection({ icon, label, count, children }: { icon: string; label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#191a1b', border: '1px solid #23252a' }}>
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#28282c]"
        style={{ borderBottom: open ? '1px solid #23252a' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold" style={{ color: label === 'User' ? '#7170ff' : '#8a8f98' }}>{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#23252a', color: '#d0d6e0' }}>{count}</span>
        </div>
        <svg className="w-4 h-4 transition-transform" style={{ color: '#8a8f98', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source badge helper
// ---------------------------------------------------------------------------

function sourceBadgeVariant(source: McpRegistryResult['source']): 'green' | 'blue' | 'orange' {
  switch (source) {
    case 'mcp-registry': return 'green';
    case 'npm': return 'blue';
    case 'smithery': return 'orange';
  }
}

function sourceLabel(source: McpRegistryResult['source']): string {
  switch (source) {
    case 'mcp-registry': return 'Official Registry';
    case 'npm': return 'npm';
    case 'smithery': return 'Smithery';
  }
}

// ---------------------------------------------------------------------------
// RegistryResultCard
// ---------------------------------------------------------------------------

function RegistryResultCard({
  result,
  onInstall,
}: {
  result: McpRegistryResult;
  onInstall: (r: McpRegistryResult) => void;
}) {
  return (
    <div
      className="rounded-xl p-5 transition-colors hover:bg-[#28282c]"
      style={{ backgroundColor: '#191a1b', border: '1px solid #23252a' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <code className="text-sm font-mono font-semibold" style={{ color: '#7170ff' }}>
              {result.name}
            </code>
            <Tag label={sourceLabel(result.source)} variant={sourceBadgeVariant(result.source)} />
            {result.version && (
              <Tag label={`v${result.version}`} variant="gray" />
            )}
          </div>

          {/* Description */}
          {result.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: '#d0d6e0' }}>
              {result.description}
            </p>
          )}

          {/* Links */}
          <div className="flex items-center gap-3 mt-2">
            {result.repositoryUrl && (
              <a
                href={result.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline transition-colors"
                style={{ color: '#8a8f98' }}
                onClick={(e) => e.stopPropagation()}
              >
                Repository
              </a>
            )}
            {result.npmUrl && (
              <a
                href={result.npmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline transition-colors"
                style={{ color: '#8a8f98' }}
                onClick={(e) => e.stopPropagation()}
              >
                npm
              </a>
            )}
          </div>
        </div>

        {/* Install button */}
        <Button variant="primary" size="sm" onClick={() => onInstall(result)}>
          Install
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton for search results
// ---------------------------------------------------------------------------

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-5 animate-pulse"
          style={{ backgroundColor: '#191a1b', border: '1px solid #23252a' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-4 rounded w-48 mb-2" style={{ backgroundColor: '#23252a' }} />
              <div className="h-3 rounded w-full mb-1" style={{ backgroundColor: '#23252a' }} />
              <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#23252a' }} />
            </div>
            <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: '#23252a' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Install dialog
// ---------------------------------------------------------------------------

function InstallDialog({
  result,
  onConfirm,
  onCancel,
  installing,
  error,
}: {
  result: McpRegistryResult;
  onConfirm: (name: string, command: string, args: string[], env: Record<string, string>) => void;
  onCancel: () => void;
  installing: boolean;
  error: string | null;
}) {
  const defaultArgs = result.installCommand
    ? result.installCommand.split(' ').slice(1)
    : ['-y', result.name];

  const [name, setName] = useState(result.name);
  const [command, setCommand] = useState('npx');
  const [args, setArgs] = useState(defaultArgs.join(' '));
  const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>([]);

  const handleAddEnvVar = () => {
    setEnvPairs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleEnvChange = (index: number, field: 'key' | 'value', val: string) => {
    setEnvPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  };

  const handleRemoveEnv = (index: number) => {
    setEnvPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const env: Record<string, string> = {};
    for (const pair of envPairs) {
      if (pair.key.trim()) env[pair.key.trim()] = pair.value;
    }
    onConfirm(
      name.trim(),
      command.trim(),
      args.trim().split(/\s+/).filter(Boolean),
      env,
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="fixed z-50 rounded-xl p-6 shadow-2xl"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '480px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          backgroundColor: '#191a1b',
          border: '1px solid #23252a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#f7f8f8' }}>
          Install MCP Server
        </h2>
        <p className="text-xs mb-5" style={{ color: '#8a8f98' }}>
          This will add the server to your user-level MCP config (~/.claude/.mcp.json).
        </p>

        {/* Source badge */}
        <div className="mb-4">
          <Tag label={sourceLabel(result.source)} variant={sourceBadgeVariant(result.source)} />
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: '#d0d6e0' }}>
            Server Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ backgroundColor: '#0f1011', border: '1px solid #23252a', color: '#f7f8f8' }}
          />
        </div>

        {/* Command field */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: '#d0d6e0' }}>
            Command
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ backgroundColor: '#0f1011', border: '1px solid #23252a', color: '#f7f8f8' }}
          />
        </div>

        {/* Args field */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={{ color: '#d0d6e0' }}>
            Arguments (space-separated)
          </label>
          <input
            type="text"
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono outline-none"
            style={{ backgroundColor: '#0f1011', border: '1px solid #23252a', color: '#f7f8f8' }}
          />
        </div>

        {/* Env vars */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: '#d0d6e0' }}>
              Environment Variables
            </label>
            <button
              className="text-xs px-2 py-0.5 rounded transition-colors"
              style={{ color: '#7170ff', backgroundColor: 'rgba(94, 106, 210, 0.1)' }}
              onClick={handleAddEnvVar}
            >
              + Add
            </button>
          </div>
          {envPairs.length === 0 && (
            <p className="text-xs" style={{ color: '#8a8f98' }}>No environment variables</p>
          )}
          {envPairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="KEY"
                value={pair.key}
                onChange={(e) => handleEnvChange(i, 'key', e.target.value)}
                className="flex-1 px-2 py-1.5 rounded text-xs font-mono outline-none"
                style={{ backgroundColor: '#0f1011', border: '1px solid #23252a', color: '#fdcb6e' }}
              />
              <input
                type="text"
                placeholder="value"
                value={pair.value}
                onChange={(e) => handleEnvChange(i, 'value', e.target.value)}
                className="flex-1 px-2 py-1.5 rounded text-xs font-mono outline-none"
                style={{ backgroundColor: '#0f1011', border: '1px solid #23252a', color: '#d0d6e0' }}
              />
              <button
                className="text-xs px-1.5 py-1 rounded transition-colors"
                style={{ color: '#ff4757' }}
                onClick={() => handleRemoveEnv(i)}
              >
                x
              </button>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1" style={{ color: '#8a8f98' }}>
            Config Preview
          </label>
          <pre
            className="rounded-lg p-3 text-xs font-mono overflow-x-auto"
            style={{ backgroundColor: '#0f1011', color: '#d0d6e0' }}
          >
            {JSON.stringify(
              {
                [name || 'server-name']: {
                  command,
                  ...(args.trim() ? { args: args.trim().split(/\s+/) } : {}),
                  ...(envPairs.some((p) => p.key.trim())
                    ? { env: Object.fromEntries(envPairs.filter((p) => p.key.trim()).map((p) => [p.key, p.value])) }
                    : {}),
                },
              },
              null,
              2,
            )}
          </pre>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="rounded-lg px-3 py-2 mb-4 text-xs"
            style={{ backgroundColor: 'rgba(255, 71, 87, 0.15)', color: '#ff4757' }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={installing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleConfirm}
            disabled={installing || !name.trim() || !command.trim()}
          >
            {installing ? 'Installing...' : 'Install'}
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// MCP Store tab content
// ---------------------------------------------------------------------------

function McpStoreTab({ onInstalled }: { onInstalled: () => void }) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [results, setResults] = useState<McpRegistryResult[]>([]);
  const [smitheryAvailable, setSmitheryAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [installTarget, setInstallTarget] = useState<McpRegistryResult | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchMcpRegistry(query);
      setResults(data.results);
      setSmitheryAvailable(data.smitheryAvailable);
      setSearched(true);
    } catch {
      // keep existing results on error
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doSearch]);

  // Clear success message after 4s
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // Filter by source
  const filtered =
    sourceFilter === 'all'
      ? results
      : results.filter((r) => r.source === sourceFilter);

  const handleInstallConfirm = async (
    name: string,
    command: string,
    args: string[],
    env: Record<string, string>,
  ) => {
    setInstalling(true);
    setInstallError(null);
    try {
      await installMcpFromRegistry(name, command, args, Object.keys(env).length > 0 ? env : undefined);
      setInstallTarget(null);
      setSuccessMessage(`Successfully installed "${name}"`);
      onInstalled();
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : 'Install failed');
    } finally {
      setInstalling(false);
    }
  };

  const sourceFilters: { key: SourceFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'mcp-registry', label: 'Official Registry' },
    { key: 'npm', label: 'npm' },
    { key: 'smithery', label: 'Smithery' },
  ];

  return (
    <div>
      {/* Search box */}
      <div className="mb-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search MCP servers..."
        />
      </div>

      {/* Source filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {sourceFilters.map((f) => (
          <button
            key={f.key}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: sourceFilter === f.key ? '#5e6ad2' : '#23252a',
              color: sourceFilter === f.key ? '#f7f8f8' : '#d0d6e0',
            }}
            onClick={() => setSourceFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Smithery note */}
      {!smitheryAvailable && searched && (
        <p className="text-xs mb-4" style={{ color: '#8a8f98' }}>
          Set SMITHERY_API_KEY environment variable to enable Smithery search.
        </p>
      )}

      {/* Success toast */}
      {successMessage && (
        <div
          className="rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2"
          style={{ backgroundColor: 'rgba(0, 184, 148, 0.15)', color: '#27a644' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Results area */}
      {loading ? (
        <SearchSkeleton />
      ) : !searched ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#191a1b', border: '1px solid #23252a' }}
        >
          <p className="text-sm mb-2" style={{ color: '#8a8f98' }}>
            Search for MCP servers across npm, Official MCP Registry, and Smithery.
          </p>
          <p className="text-xs" style={{ color: '#62666d' }}>
            Type a search term above to get started.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#191a1b', border: '1px solid #23252a' }}
        >
          <p className="text-sm" style={{ color: '#8a8f98' }}>
            No results found for &ldquo;{search}&rdquo;
            {sourceFilter !== 'all' ? ` in ${sourceLabel(sourceFilter)}` : ''}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: '#8a8f98' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
          {filtered.map((r) => (
            <RegistryResultCard
              key={`${r.source}-${r.name}`}
              result={r}
              onInstall={setInstallTarget}
            />
          ))}
        </div>
      )}

      {/* Install dialog */}
      {installTarget && (
        <InstallDialog
          result={installTarget}
          onConfirm={handleInstallConfirm}
          onCancel={() => {
            setInstallTarget(null);
            setInstallError(null);
          }}
          installing={installing}
          error={installError}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function McpServersPage() {
  const { data: serversRaw, isLoading: loading, mutate } = useMcpServers();
  const servers = (serversRaw ?? []) as McpServer[];
  const [selected, setSelected] = useState<McpServer | null>(null);
  const [tab, setTab] = useState<'installed' | 'store'>('installed');

  // Split by source
  const userServers = servers.filter((s) => s.source === 'user' || !s.source);
  const systemServers = servers.filter((s) => s.source === 'system');

  async function handleRemove(name: string) {
    try {
      await removeMcpServer(name);
      mutate();
      setSelected(null);
    } catch (err) {
      console.error('Failed to remove MCP server', err);
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#08090a]">
        <Header title="MCP Servers">
          <Button variant="primary" size="md">Add Server</Button>
        </Header>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'installed' ? '#5e6ad2' : 'transparent',
              color: tab === 'installed' ? '#f7f8f8' : '#8a8f98',
            }}
            onClick={() => setTab('installed')}
          >
            Installed
          </button>
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'store' ? '#5e6ad2' : 'transparent',
              color: tab === 'store' ? '#f7f8f8' : '#8a8f98',
            }}
            onClick={() => setTab('store')}
          >
            MCP Store
          </button>
        </div>
      </div>

      {tab === 'installed' ? (
        /* ---- Installed tab ---- */
        <>
          {loading ? (
            <p style={{ color: '#d0d6e0' }}>Loading...</p>
          ) : servers.length === 0 ? (
            <div
              className="rounded-xl p-10 text-center"
              style={{ backgroundColor: '#191a1b', border: '1px solid #23252a' }}
            >
              <p className="text-sm" style={{ color: '#8a8f98' }}>
                No MCP servers configured. Click &ldquo;Add Server&rdquo; to get started, or browse
                the <button className="underline" style={{ color: '#7170ff' }} onClick={() => setTab('store')}>MCP Store</button>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Servers Section */}
              {userServers.length > 0 && (
                <CollapsibleSection icon="👤" label="User" count={userServers.length}>
                  {userServers.map((server) => (
                    <McpItem key={server.name} server={server} onClick={() => setSelected(server)} />
                  ))}
                </CollapsibleSection>
              )}

              {/* System Servers Section */}
              {systemServers.length > 0 && (
                <CollapsibleSection icon="🔧" label="System" count={systemServers.length}>
                  {systemServers.map((server) => (
                    <McpItem key={server.name} server={server} onClick={() => setSelected(server)} />
                  ))}
                </CollapsibleSection>
              )}
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
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8a8f98' }}>
                    Connection Config
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs" style={{ color: '#8a8f98' }}>Command</span>
                      <code className="text-xs font-mono" style={{ color: '#7170ff' }}>
                        {selected.config.command}
                      </code>
                    </div>
                    {selected.config.args && selected.config.args.length > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-xs" style={{ color: '#8a8f98' }}>Args</span>
                        <code className="text-xs font-mono text-right" style={{ color: '#d0d6e0' }}>
                          {selected.config.args.join(' ')}
                        </code>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-xs" style={{ color: '#8a8f98' }}>Scope</span>
                      <span className="text-xs" style={{ color: '#d0d6e0' }}>Global</span>
                    </div>
                  </div>
                </section>

                {/* Environment Variables */}
                {selected.config.env && Object.keys(selected.config.env).length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8a8f98' }}>
                      Environment Variables
                    </h3>
                    <div
                      className="rounded-lg p-3 space-y-2"
                      style={{ backgroundColor: '#0f1011' }}
                    >
                      {Object.entries(selected.config.env).map(([key]) => (
                        <div key={key} className="flex justify-between gap-4">
                          <code className="text-xs font-mono" style={{ color: '#fdcb6e' }}>{key}</code>
                          <code className="text-xs font-mono" style={{ color: '#8a8f98' }}>--------</code>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tools placeholder */}
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8a8f98' }}>
                    Tools Provided
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Tag label="Tools available when connected" variant="purple" />
                  </div>
                </section>
              </div>
            )}
          </DetailPanel>
        </>
      ) : (
        /* ---- MCP Store tab ---- */
        <McpStoreTab onInstalled={() => mutate()} />
      )}
    </div>
  );
}
