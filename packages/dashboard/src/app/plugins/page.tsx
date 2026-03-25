'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchBox } from '@/components/shared/search-box';
import { Button } from '@/components/shared/button';
import { Tag } from '@/components/shared/tag';
import { PluginItem } from '@/components/plugin-list/plugin-item';
import type { Plugin } from '@/components/plugin-list/plugin-item';
import { fetchPlugins, removePlugin, togglePlugin } from '@/lib/api-client';

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Plugin | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  async function loadPlugins() {
    try {
      const data = await fetchPlugins();
      setPlugins(data as Plugin[]);
    } catch (err) {
      console.error('Failed to load plugins', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRemove(name: string) {
    try {
      await removePlugin(name);
      setPlugins((prev) => prev.filter((p) => p.name !== name));
      setSelected(null);
    } catch (err) {
      console.error('Failed to remove plugin', err);
    }
  }

  async function handleToggle(plugin: Plugin) {
    try {
      await togglePlugin(plugin.name, !plugin.enabled);
      const updated = { ...plugin, enabled: !plugin.enabled };
      setPlugins((prev) => prev.map((p) => (p.name === plugin.name ? updated : p)));
      setSelected(updated);
    } catch (err) {
      console.error('Failed to toggle plugin', err);
    }
  }

  return (
    <div>
      <Header title="Plugins">
        <Button variant="primary" size="md">Install New</Button>
      </Header>

      <div className="mb-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search plugins..."
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
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          {filtered.map((plugin) => (
            <PluginItem
              key={plugin.name}
              plugin={plugin}
              onClick={() => setSelected(plugin)}
            />
          ))}
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
            {/* Metadata grid */}
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

            {/* Status */}
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
    </div>
  );
}
