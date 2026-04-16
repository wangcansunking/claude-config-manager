'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/shared/button';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { ProfileCard } from '@/components/profile-grid/profile-card';
import type { Profile } from '@/components/profile-grid/profile-card';
import { createProfile, activateProfile, deleteProfile, exportProfile, updateProfile, fetchPlugins, fetchMcpServers } from '@/lib/api-client';
import { useProfiles } from '@/lib/use-data';

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
        <Button variant="primary" size="md" onClick={() => setShowNewForm(!showNewForm)}>
          New Profile
        </Button>
      </Header>

      {/* New Profile Form */}
      {showNewForm && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #6c5ce7' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#ffffff' }}>
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
                backgroundColor: '#2a2a35',
                border: '1px solid',
                color: '#ffffff',
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
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : profiles.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
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
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #6c5ce7', borderTop: 'none' }}
                >
                  {/* Profile Name (read-only label) & Description */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                      Profile Name
                    </label>
                    <p className="text-sm font-medium" style={{ color: '#ffffff' }}>{editState.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={editState.description}
                      onChange={(e) => setEditState((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                      placeholder="Optional description..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none profile-input"
                      style={{ backgroundColor: '#2a2a35', border: '1px solid', color: '#ffffff' }}
                    />
                  </div>

                  {/* Plugins */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                      Plugins
                    </label>
                    {availablePlugins.length === 0 && Object.keys(editState.enabledPlugins).length === 0 ? (
                      <p className="text-xs" style={{ color: '#636e72' }}>No plugins available.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg p-2" style={{ backgroundColor: '#16161d' }}>
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
                                className="accent-[#6c5ce7]"
                              />
                              <span className="text-xs" style={{ color: '#b2bec3' }}>{name}</span>
                            </label>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* MCP Servers */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                      MCP Servers
                    </label>
                    {availableMcpServers.length === 0 && Object.keys(editState.enabledMcpServers).length === 0 ? (
                      <p className="text-xs" style={{ color: '#636e72' }}>No MCP servers available.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg p-2" style={{ backgroundColor: '#16161d' }}>
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
                                className="accent-[#6c5ce7]"
                              />
                              <span className="text-xs" style={{ color: '#b2bec3' }}>{name}</span>
                            </label>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Settings */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                      Settings
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: '#636e72' }}>Model</label>
                        <input
                          type="text"
                          value={editState.model}
                          onChange={(e) => setEditState((prev) => prev ? { ...prev, model: e.target.value } : prev)}
                          placeholder="e.g. claude-sonnet-4-20250514"
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none profile-input"
                          style={{ backgroundColor: '#2a2a35', border: '1px solid', color: '#ffffff' }}
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
