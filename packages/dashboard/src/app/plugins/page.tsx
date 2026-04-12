'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchBox } from '@/components/shared/search-box';
import { Button } from '@/components/shared/button';
import { Tag } from '@/components/shared/tag';
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
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
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
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#252530]"
                  style={{ borderBottom: isCollapsed ? 'none' : '1px solid #2a2a35' }}
                  onClick={() => setCollapsed(prev => ({ ...prev, [marketplace]: !prev[marketplace] }))}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: '#a29bfe' }}>
                      {marketplace}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#2a2a35', color: '#b2bec3' }}
                    >
                      {marketplacePlugins.length}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 transition-transform"
                    style={{ color: '#636e72', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
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
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
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
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
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
                    <span className="text-xs" style={{ color: '#636e72' }}>{label}</span>
                    <span
                      className="text-xs text-right break-all font-mono"
                      style={{ color: '#b2bec3', maxWidth: '240px' }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
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
  const [showInstallMsg, setShowInstallMsg] = useState<string | null>(null);

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
        <select
          className="rounded-lg text-sm px-3 py-2 outline-none"
          style={{
            backgroundColor: '#2a2a35',
            border: '1px solid #3a3a45',
            color: '#ffffff',
          }}
          value={activeMp ?? ''}
          onChange={(e) => {
            setSelectedMp(e.target.value);
            setSearch('');
            setSelectedPlugin(null);
          }}
          disabled={marketplacesLoading || marketplaces.length === 0}
        >
          {marketplaces.length === 0 && (
            <option value="">No marketplaces</option>
          )}
          {marketplaces.map((mp) => (
            <option key={mp.name} value={mp.name}>
              {mp.name}
            </option>
          ))}
        </select>

        <div className="flex-1">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search available plugins..."
          />
        </div>

        {filtered.length > 0 && (
          <span className="text-xs shrink-0" style={{ color: '#636e72' }}>
            {filtered.length} plugin{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Install instruction toast */}
      {showInstallMsg && (
        <div
          className="rounded-lg p-4 mb-4 flex items-start justify-between gap-3"
          style={{ backgroundColor: 'rgba(9, 132, 227, 0.12)', border: '1px solid rgba(9, 132, 227, 0.3)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: '#74b9ff' }}>
              Install via Claude Code
            </p>
            <code
              className="text-xs mt-1 block font-mono px-2 py-1 rounded"
              style={{ backgroundColor: '#16161d', color: '#b2bec3' }}
            >
              /plugin install {showInstallMsg}@{activeMp}
            </code>
          </div>
          <button
            className="shrink-0 p-1 rounded transition-colors hover:bg-[#2a2a35]"
            style={{ color: '#636e72' }}
            onClick={() => setShowInstallMsg(null)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Plugin list */}
      {pluginsLoading || marketplacesLoading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : !activeMp ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
            No marketplaces configured. Add one in the &quot;Manage Marketplaces&quot; tab.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
            {search ? 'No plugins match your search.' : 'No plugins found in this marketplace.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCategories.map(([category, catPlugins]) => (
            <div key={category}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
                style={{ color: '#636e72' }}
              >
                {category} ({catPlugins.length})
              </h3>
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                {catPlugins.map((plugin, idx) => (
                  <div
                    key={plugin.name}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#252530]"
                    style={{ borderBottom: idx < catPlugins.length - 1 ? '1px solid #2a2a35' : 'none' }}
                    onClick={() => setSelectedPlugin(plugin)}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold"
                      style={{
                        background: plugin.installed
                          ? 'linear-gradient(135deg, #00b894, #55efc4)'
                          : 'linear-gradient(135deg, #0984e3, #74b9ff)',
                      }}
                    >
                      {plugin.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
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
                        style={{ color: '#b2bec3' }}
                      >
                        {plugin.description || 'No description available.'}
                      </p>
                    </div>

                    {/* Install / Info button */}
                    {!plugin.installed && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInstallMsg(plugin.name);
                        }}
                      >
                        Install
                      </Button>
                    )}

                    {/* Chevron */}
                    <svg
                      className="w-4 h-4 shrink-0"
                      style={{ color: '#636e72' }}
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
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{
              background: selectedPlugin?.installed
                ? 'linear-gradient(135deg, #00b894, #55efc4)'
                : 'linear-gradient(135deg, #0984e3, #74b9ff)',
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
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
                Description
              </h3>
              <p className="text-sm" style={{ color: '#b2bec3' }}>
                {selectedPlugin.description || 'No description available.'}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
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
                    <span className="text-xs" style={{ color: '#636e72' }}>{label}</span>
                    {label === 'Homepage' ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-right break-all font-mono hover:underline"
                        style={{ color: '#74b9ff', maxWidth: '240px' }}
                      >
                        {value}
                      </a>
                    ) : (
                      <span
                        className="text-xs text-right break-all font-mono"
                        style={{ color: '#b2bec3', maxWidth: '240px' }}
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
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
                  Installation
                </h3>
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: '#16161d' }}
                >
                  <p className="text-xs mb-2" style={{ color: '#b2bec3' }}>
                    Run this command in Claude Code to install:
                  </p>
                  <code
                    className="text-xs block font-mono px-2 py-1 rounded"
                    style={{ backgroundColor: '#2a2a35', color: '#a29bfe' }}
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
        className="rounded-xl p-5 mb-6"
        style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
          Add Marketplace
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: '#636e72' }}>
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., my-plugins"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: '#2a2a35',
                border: '1px solid #3a3a45',
                color: '#ffffff',
              }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: '#636e72' }}>
              GitHub Repository
            </label>
            <input
              type="text"
              value={newRepo}
              onChange={(e) => setNewRepo(e.target.value)}
              placeholder="e.g., owner/repo-name"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: '#2a2a35',
                border: '1px solid #3a3a45',
                color: '#ffffff',
              }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: '#ff4757' }}>{error}</p>
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
        <p className="text-xs mt-3" style={{ color: '#636e72' }}>
          Note: Adding a marketplace here only registers it. To clone the repository,
          run <code style={{ color: '#a29bfe' }}>/marketplace add</code> in Claude Code.
        </p>
      </div>

      {/* Marketplace list */}
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#636e72' }}>
        Registered Marketplaces
      </h3>

      {isLoading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : marketplaces.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
            No marketplaces registered.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          {marketplaces.map((mp, idx) => (
            <div
              key={mp.name}
              className="flex items-center gap-4 px-5 py-4"
              style={{ borderBottom: idx < marketplaces.length - 1 ? '1px solid #2a2a35' : 'none' }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #e17055, #fab1a0)' }}
              >
                {mp.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
                  {mp.name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Tag label={mp.source.repo} variant="blue" />
                  <Tag label={mp.source.source} variant="gray" />
                  <span className="text-xs" style={{ color: '#636e72' }}>
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
      <div className="sticky top-0 z-10 bg-[#0f0f14]">
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
                backgroundColor: tab === id ? '#6c5ce7' : 'transparent',
                color: tab === id ? '#fff' : '#636e72',
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
