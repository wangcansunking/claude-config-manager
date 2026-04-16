
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchBox } from '@/components/shared/search-box';
import { Button } from '@/components/shared/button';
import { Tag } from '@/components/shared/tag';
import { Select } from '@/components/shared/select';
import { PluginItem } from '@/components/plugin-list/plugin-item';
import type { Plugin } from '@/components/plugin-list/plugin-item';
import { removePlugin, togglePlugin, addMarketplace, removeMarketplace } from '@/lib/api-client';
import { usePlugins, useMarketplaces, useAvailablePlugins } from '@/lib/use-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketplaceData {
  name: string;
  source: { source: string; repo: string };
  installLocation: string;
  lastUpdated: string;
}

interface AvailablePluginData {
  name: string;
  description: string;
  version: string;
  installed: boolean;
  enabled: boolean;
  marketplace: string;
  category?: string;
  homepage?: string;
}

type TabId = 'installed' | 'marketplace' | 'manage';

// ---------------------------------------------------------------------------
// InstalledTab — existing installed plugins view
// ---------------------------------------------------------------------------

function InstalledTab() {
  const { data: pluginsRaw, isLoading: loading, mutate } = usePlugins();
  const plugins = (pluginsRaw ?? []) as Plugin[];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Plugin | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRemove(name: string) {
    try {
      await removePlugin(name);
      mutate();
      setSelected(null);
    } catch (err) {
      console.error('Failed to remove plugin', err);
    }
  }

  async function handleToggle(plugin: Plugin) {
    try {
      await togglePlugin(plugin.name, !plugin.enabled);
      mutate();
      setSelected({ ...plugin, enabled: !plugin.enabled });
    } catch (err) {
      console.error('Failed to toggle plugin', err);
    }
  }

  return (
    <>
      <div className="mb-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search installed plugins..."
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No plugins match your search.' : 'No plugins installed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            filtered.reduce<Record<string, Plugin[]>>((acc, p) => {
              const mp = p.marketplace || 'unknown';
              if (!acc[mp]) acc[mp] = [];
              acc[mp].push(p);
              return acc;
            }, {})
          ).map(([marketplace, marketplacePlugins]) => {
            const isCollapsed = collapsed[marketplace];
            return (
              <div
                key={marketplace}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-bg-hover"
                  style={{ borderBottom: isCollapsed ? 'none' : '1px solid var(--border)' }}
                  onClick={() => setCollapsed(prev => ({ ...prev, [marketplace]: !prev[marketplace] }))}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>
                      {marketplace}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {marketplacePlugins.length}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 transition-transform"
                    style={{ color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div>
                    {marketplacePlugins.map((plugin) => (
                      <PluginItem
                        key={plugin.name}
                        plugin={plugin}
                        onClick={() => setSelected(plugin)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected?.marketplace}
        icon={
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-primary text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}
          >
            {selected?.name.charAt(0).toUpperCase()}
          </div>
        }
        tags={selected ? [
          { label: `v${selected.version}`, variant: 'gray' },
          { label: selected.marketplace, variant: 'blue' },
          { label: selected.enabled ? 'Enabled' : 'Disabled', variant: selected.enabled ? 'green' : 'red' },
        ] : []}
        actions={selected ? (
          <>
            <Button variant="secondary" size="sm">Check Updates</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleToggle(selected)}
            >
              {selected.enabled ? 'Disable' : 'Enable'}
            </Button>
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
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Metadata
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Marketplace', value: selected.marketplace },
                  { label: 'Installed', value: new Date(selected.installedAt).toLocaleDateString() },
                  { label: 'Last Updated', value: new Date(selected.lastUpdated).toLocaleDateString() },
                  { label: 'Install Path', value: selected.installPath },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span
                      className="text-xs text-right break-all font-mono"
                      style={{ color: 'var(--text-secondary)', maxWidth: '240px' }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Status
              </h3>
              <div className="flex gap-2">
                <Tag
                  label={selected.enabled ? 'Enabled' : 'Disabled'}
                  variant={selected.enabled ? 'green' : 'red'}
                />
              </div>
            </section>
          </div>
        )}
      </DetailPanel>
    </>
  );
}

// ---------------------------------------------------------------------------
// MarketplaceTab — browse available plugins from a marketplace
// ---------------------------------------------------------------------------

function MarketplaceTab() {
  const { data: marketplacesRaw, isLoading: marketplacesLoading } = useMarketplaces();
  const marketplaces = (marketplacesRaw ?? []) as MarketplaceData[];
  const [selectedMp, setSelectedMp] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<AvailablePluginData | null>(null);
  const [, setShowInstallMsg] = useState<string | null>(null);

  // Auto-select first marketplace
  const activeMp = selectedMp ?? (marketplaces.length > 0 ? marketplaces[0].name : null);
  const { data: pluginsRaw, isLoading: pluginsLoading } = useAvailablePlugins(activeMp);
  const plugins = (pluginsRaw ?? []) as AvailablePluginData[];

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const categories = filtered.reduce<Record<string, AvailablePluginData[]>>((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const sortedCategories = Object.entries(categories).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      {/* Controls row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Marketplace selector */}
        <div className="w-56">
          <Select
            value={activeMp ?? ''}
            onChange={(val) => {
              setSelectedMp(val);
              setSearch('');
              setSelectedPlugin(null);
            }}
            options={
              marketplaces.length === 0
                ? [{ value: '', label: 'No marketplaces' }]
                : marketplaces.map((mp) => ({ value: mp.name, label: mp.name }))
            }
            placeholder="Select marketplace..."
            disabled={marketplacesLoading || marketplaces.length === 0}
          />
        </div>

        <div className="flex-1">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search available plugins..."
          />
        </div>

        {filtered.length > 0 && (
          <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} plugin{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* (Install toast removed — install command shown inline) */}

      {/* Plugin list */}
      {pluginsLoading || marketplacesLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : !activeMp ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No marketplaces configured. Add one in the &quot;Manage Marketplaces&quot; tab.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No plugins match your search.' : 'No plugins found in this marketplace.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map(([category, catPlugins]) => (
            <div key={category}>
              <h3
                className="text-xs font-medium uppercase tracking-wider mb-2 px-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {category} ({catPlugins.length})
              </h3>
              <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                {catPlugins.map((plugin, idx) => (
                  <div
                    key={plugin.name}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-bg-hover"
                    style={{ borderBottom: idx < catPlugins.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onClick={() => setSelectedPlugin(plugin)}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-text-primary text-sm font-medium"
                      style={{
                        background: plugin.installed
                          ? 'linear-gradient(135deg, var(--status-green), #4ade80)'
                          : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                      }}
                    >
                      {plugin.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {plugin.name}
                        </p>
                        {plugin.installed ? (
                          <Tag label="Installed" variant="green" />
                        ) : (
                          <Tag label="Available" variant="blue" />
                        )}
                        {plugin.installed && plugin.enabled && (
                          <Tag label="Enabled" variant="green" />
                        )}
                      </div>
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {plugin.description || 'No description available.'}
                      </p>
                    </div>

                    {/* Install command */}
                    {!plugin.installed && (
                      <code
                        className="text-xs font-mono px-2 py-1 rounded shrink-0 cursor-pointer inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-light)', border: '1px solid var(--border)' }}
                        title="Click to copy"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(`/plugin install ${plugin.name}@${activeMp}`);
                          const el = e.currentTarget;
                          el.style.color = 'var(--status-green)';
                          setTimeout(() => { el.style.color = 'var(--accent-light)'; }, 1000);
                        }}
                      >
                        /plugin install {plugin.name}@{activeMp}
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </code>
                    )}

                    {/* Chevron */}
                    <svg
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel for selected marketplace plugin */}
      <DetailPanel
        open={selectedPlugin !== null}
        onClose={() => setSelectedPlugin(null)}
        title={selectedPlugin?.name ?? ''}
        subtitle={selectedPlugin?.marketplace}
        icon={
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-primary text-sm font-medium"
            style={{
              background: selectedPlugin?.installed
                ? 'linear-gradient(135deg, var(--status-green), #4ade80)'
                : 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            }}
          >
            {selectedPlugin?.name.charAt(0).toUpperCase()}
          </div>
        }
        tags={selectedPlugin ? [
          { label: `v${selectedPlugin.version}`, variant: 'gray' as const },
          { label: selectedPlugin.marketplace, variant: 'blue' as const },
          { label: selectedPlugin.installed ? 'Installed' : 'Available', variant: selectedPlugin.installed ? 'green' as const : 'blue' as const },
          ...(selectedPlugin.category ? [{ label: selectedPlugin.category, variant: 'purple' as const }] : []),
        ] : []}
        actions={selectedPlugin && !selectedPlugin.installed ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowInstallMsg(selectedPlugin.name);
              setSelectedPlugin(null);
            }}
          >
            Install
          </Button>
        ) : undefined}
      >
        {selectedPlugin && (
          <div className="space-y-5">
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Description
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {selectedPlugin.description || 'No description available.'}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Details
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Version', value: selectedPlugin.version },
                  { label: 'Marketplace', value: selectedPlugin.marketplace },
                  ...(selectedPlugin.category ? [{ label: 'Category', value: selectedPlugin.category }] : []),
                  ...(selectedPlugin.homepage ? [{ label: 'Homepage', value: selectedPlugin.homepage }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    {label === 'Homepage' ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-right break-all font-mono hover:underline"
                        style={{ color: 'var(--accent-hover)', maxWidth: '240px' }}
                      >
                        {value}
                      </a>
                    ) : (
                      <span
                        className="text-xs text-right break-all font-mono"
                        style={{ color: 'var(--text-secondary)', maxWidth: '240px' }}
                      >
                        {value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {!selectedPlugin.installed && (
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Installation
                </h3>
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Run this command in Claude Code to install:
                  </p>
                  <code
                    className="text-xs block font-mono px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--accent-light)' }}
                  >
                    /plugin install {selectedPlugin.name}@{selectedPlugin.marketplace}
                  </code>
                </div>
              </section>
            )}
          </div>
        )}
      </DetailPanel>
    </>
  );
}

// ---------------------------------------------------------------------------
// ManageMarketplacesTab — add/remove marketplace sources
// ---------------------------------------------------------------------------

function ManageMarketplacesTab() {
  const { data: marketplacesRaw, isLoading, mutate } = useMarketplaces();
  const marketplaces = (marketplacesRaw ?? []) as MarketplaceData[];
  const [newName, setNewName] = useState('');
  const [newRepo, setNewRepo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newName.trim() || !newRepo.trim()) {
      setError('Both name and repository are required.');
      return;
    }
    setError(null);
    setAdding(true);
    try {
      await addMarketplace(newName.trim(), newRepo.trim());
      mutate();
      setNewName('');
      setNewRepo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add marketplace');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(name: string) {
    try {
      await removeMarketplace(name);
      mutate();
    } catch (err) {
      console.error('Failed to remove marketplace', err);
    }
  }

  return (
    <>
      {/* Add Marketplace form */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
          Add Marketplace
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., my-plugins"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--border)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
              GitHub Repository
            </label>
            <input
              type="text"
              value={newRepo}
              onChange={(e) => setNewRepo(e.target.value)}
              placeholder="e.g., owner/repo-name"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--border)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: 'var(--status-red)' }}>{error}</p>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? 'Adding...' : 'Add Marketplace'}
          </Button>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Note: Adding a marketplace here only registers it. To clone the repository,
          run <code style={{ color: 'var(--accent-light)' }}>/marketplace add</code> in Claude Code.
        </p>
      </div>

      {/* Marketplace list */}
      <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Registered Marketplaces
      </h3>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : marketplaces.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No marketplaces registered.
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          {marketplaces.map((mp, idx) => (
            <div
              key={mp.name}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: idx < marketplaces.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-text-primary text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, var(--text-secondary), var(--accent-hover))' }}
              >
                {mp.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {mp.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Tag label={mp.source.repo} variant="blue" />
                  <Tag label={mp.source.source} variant="gray" />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Updated: {new Date(mp.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRemove(mp.name)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PluginsPage() {
  const [tab, setTab] = useState<TabId>('installed');

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-primary">
        <Header title="Plugins" />

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {([
            { id: 'installed' as TabId, label: 'Installed' },
            { id: 'marketplace' as TabId, label: 'Marketplace' },
            { id: 'manage' as TabId, label: 'Manage Marketplaces' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: tab === id ? 'var(--accent)' : 'transparent',
                color: tab === id ? '#fff' : 'var(--text-muted)',
              }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'installed' && <InstalledTab />}
      {tab === 'marketplace' && <MarketplaceTab />}
      {tab === 'manage' && <ManageMarketplacesTab />}
    </div>
  );
}
