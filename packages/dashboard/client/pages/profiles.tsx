
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/shared/button';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { ProfileCard } from '@/components/profile-grid/profile-card';
import type { Profile } from '@/components/profile-grid/profile-card';
import { ExportPanel } from '@/components/export-import/export-panel';
import { ImportPanel } from '@/components/export-import/import-panel';
import { createProfile, activateProfile, deleteProfile, exportProfile, updateProfile, fetchPlugins, fetchMcpServers } from '@/lib/api-client';
import { useProfiles } from '@/lib/use-data';

type ProfileTabId = 'profiles' | 'export-import';

interface AvailablePlugin {
  name: string;
  version: string;
  marketplace: string;
  enabled: boolean;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

interface AvailableMcpServer {
  name: string;
  config: { command: string; args?: string[]; env?: Record<string, string> };
  enabled?: boolean;
}

interface EditState {
  name: string;
  description: string;
  enabledPlugins: Record<string, boolean>;
  enabledMcpServers: Record<string, boolean>;
  model: string;
  saving: boolean;
}

export default function ProfilesPage() {
  const { data: profilesRaw, isLoading: loading, mutate } = useProfiles();
  const profiles = (profilesRaw ?? []) as Profile[];
  const [profileTab, setProfileTab] = useState<ProfileTabId>('profiles');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [availablePlugins, setAvailablePlugins] = useState<AvailablePlugin[]>([]);
  const [availableMcpServers, setAvailableMcpServers] = useState<AvailableMcpServer[]>([]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createProfile(name);
      mutate();
      setNewName('');
      setShowNewForm(false);
    } catch (err) {
      console.error('Failed to create profile', err);
    } finally {
      setCreating(false);
    }
  }

  async function handleActivate(name: string) {
    try {
      await activateProfile(name);
      mutate();
    } catch (err) {
      console.error('Failed to activate profile', err);
    }
  }

  async function handleDelete(name: string) {
    try {
      await deleteProfile(name);
      mutate();
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete profile', err);
    }
  }

  async function handleExport(name: string) {
    try {
      const data = await exportProfile(name);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}-profile.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export profile', err);
    }
  }

  async function handleEdit(profileName: string) {
    const profile = profiles.find((p) => p.name === profileName);
    if (!profile) return;

    // Load available plugins and MCP servers in parallel
    try {
      const [plugins, mcpServers] = await Promise.all([
        fetchPlugins().catch(() => []),
        fetchMcpServers().catch(() => []),
      ]);
      setAvailablePlugins(plugins as AvailablePlugin[]);
      setAvailableMcpServers(mcpServers as AvailableMcpServer[]);
    } catch {
      // Proceed with empty lists
    }

    // Build enabled maps from profile data
    const enabledPlugins: Record<string, boolean> = {};
    if (Array.isArray(profile.plugins)) {
      for (const p of profile.plugins as Array<{ name: string; enabled: boolean }>) {
        enabledPlugins[p.name] = p.enabled;
      }
    }

    const enabledMcpServers: Record<string, boolean> = {};
    if (profile.mcpServers && typeof profile.mcpServers === 'object') {
      for (const name of Object.keys(profile.mcpServers as Record<string, unknown>)) {
        enabledMcpServers[name] = true;
      }
    }

    const settings = (profile.settings ?? {}) as Record<string, unknown>;

    setEditState({
      name: profile.name,
      description: profile.description ?? '',
      enabledPlugins,
      enabledMcpServers,
      model: (settings['model'] as string) ?? '',
      saving: false,
    });
    setEditingProfile(profileName);
  }

  async function handleSaveEdit() {
    if (!editState || !editingProfile) return;
    setEditState((prev) => prev ? { ...prev, saving: true } : prev);

    const profile = profiles.find((p) => p.name === editingProfile);
    if (!profile) return;

    try {
      // Build updated plugins array
      const existingPlugins = (Array.isArray(profile.plugins) ? profile.plugins : []) as Array<{
        name: string;
        version: string;
        marketplace: string;
        enabled: boolean;
        installPath: string;
        installedAt: string;
        lastUpdated: string;
      }>;

      const updatedPlugins = existingPlugins.map((p) => ({
        ...p,
        enabled: editState.enabledPlugins[p.name] ?? p.enabled,
      }));

      // Build updated mcpServers
      const existingMcp = (profile.mcpServers ?? {}) as Record<string, unknown>;
      const allMcp = { ...existingMcp };
      // Add any newly enabled servers from available list
      for (const srv of availableMcpServers) {
        if (editState.enabledMcpServers[srv.name] && !allMcp[srv.name]) {
          allMcp[srv.name] = srv.config;
        }
      }
      // Remove disabled servers
      const updatedMcp: Record<string, unknown> = {};
      for (const [name, config] of Object.entries(allMcp)) {
        if (editState.enabledMcpServers[name]) {
          updatedMcp[name] = config;
        }
      }

      // Build updated settings
      const existingSettings = (profile.settings ?? {}) as Record<string, unknown>;
      const updatedSettings = { ...existingSettings };
      if (editState.model) {
        updatedSettings['model'] = editState.model;
      } else {
        delete updatedSettings['model'];
      }

      const patch = {
        description: editState.description || undefined,
        plugins: updatedPlugins,
        mcpServers: updatedMcp,
        settings: updatedSettings,
      };

      await updateProfile(editingProfile, patch);
      mutate();
      setEditingProfile(null);
      setEditState(null);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setEditState((prev) => prev ? { ...prev, saving: false } : prev);
    }
  }

  function handleCancelEdit() {
    setEditingProfile(null);
    setEditState(null);
  }

  return (
    <div>
      <Header title="Profiles">
        {profileTab === 'profiles' && (
          <Button variant="primary" size="md" onClick={() => setShowNewForm(!showNewForm)}>
            New Profile
          </Button>
        )}
      </Header>

      {/* Tabs: Profiles | Export / Import */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {([
          { id: 'profiles' as ProfileTabId, label: 'Profiles' },
          { id: 'export-import' as ProfileTabId, label: 'Export / Import' },
        ]).map(({ id, label }) => (
          <button
            key={id}
            className="px-4 py-2 rounded-md text-sm transition-colors"
            style={{
              backgroundColor: profileTab === id ? 'var(--accent)' : 'transparent',
              color: profileTab === id ? '#fff' : 'var(--text-muted)',
              fontWeight: profileTab === id ? 510 : 400,
            }}
            onClick={() => setProfileTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {profileTab === 'export-import' ? (
        loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <ExportPanel profiles={profiles} />
            <ImportPanel />
          </div>
        )
      ) : (
      <>

      {/* New Profile Form */}
      {showNewForm && (
        <div
          className="rounded-lg p-5 mb-6"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--accent)' }}
        >
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            Create New Profile
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Profile name..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none profile-input"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <Button variant="primary" size="md" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
            <Button variant="ghost" size="md" onClick={() => { setShowNewForm(false); setNewName(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : profiles.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No profiles yet. Click &ldquo;New Profile&rdquo; to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <div key={profile.name}>
              <ProfileCard
                profile={profile}
                onActivate={() => handleActivate(profile.name)}
                onEdit={() => handleEdit(profile.name)}
                onExport={() => handleExport(profile.name)}
                onDelete={() => setDeleteTarget(profile.name)}
              />

              {/* Inline Edit Panel */}
              {editingProfile === profile.name && editState && (
                <div
                  className="rounded-b-xl p-5 -mt-1 space-y-5"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)', borderTop: 'none' }}
                >
                  {/* Profile Name (read-only label) & Description */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Profile Name
                    </label>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{editState.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={editState.description}
                      onChange={(e) => setEditState((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                      placeholder="Optional description..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none profile-input"
                      style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Plugins */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Plugins
                    </label>
                    {availablePlugins.length === 0 && Object.keys(editState.enabledPlugins).length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No plugins available.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg p-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        {(() => {
                          // Merge: show all known plugin names
                          const allNames = new Set([
                            ...availablePlugins.map((p) => p.name),
                            ...Object.keys(editState.enabledPlugins),
                          ]);
                          return Array.from(allNames).map((name) => (
                            <label key={name} className="flex items-center gap-2 cursor-pointer py-0.5">
                              <input
                                type="checkbox"
                                checked={editState.enabledPlugins[name] ?? false}
                                onChange={(e) => {
                                  setEditState((prev) =>
                                    prev ? { ...prev, enabledPlugins: { ...prev.enabledPlugins, [name]: e.target.checked } } : prev
                                  );
                                }}
                                className="accent-accent-purple"
                              />
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                            </label>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* MCP Servers */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      MCP Servers
                    </label>
                    {availableMcpServers.length === 0 && Object.keys(editState.enabledMcpServers).length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No MCP servers available.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg p-2" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        {(() => {
                          const allNames = new Set([
                            ...availableMcpServers.map((s) => s.name),
                            ...Object.keys(editState.enabledMcpServers),
                          ]);
                          return Array.from(allNames).map((name) => (
                            <label key={name} className="flex items-center gap-2 cursor-pointer py-0.5">
                              <input
                                type="checkbox"
                                checked={editState.enabledMcpServers[name] ?? false}
                                onChange={(e) => {
                                  setEditState((prev) =>
                                    prev ? { ...prev, enabledMcpServers: { ...prev.enabledMcpServers, [name]: e.target.checked } } : prev
                                  );
                                }}
                                className="accent-accent-purple"
                              />
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{name}</span>
                            </label>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Settings */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Settings
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Model</label>
                        <input
                          type="text"
                          value={editState.model}
                          onChange={(e) => setEditState((prev) => prev ? { ...prev, model: e.target.value } : prev)}
                          placeholder="e.g. claude-sonnet-4-20250514"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none profile-input"
                          style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={editState.saving}>
                      {editState.saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      </>
      )}

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Profile"
        message={`Are you sure you want to delete profile "${deleteTarget}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
