'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/shared/button';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { ProfileCard } from '@/components/profile-grid/profile-card';
import type { Profile } from '@/components/profile-grid/profile-card';
import { fetchProfiles, createProfile, activateProfile, deleteProfile, exportProfile } from '@/lib/api-client';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const data = await fetchProfiles();
      setProfiles(data as Profile[]);
    } catch (err) {
      console.error('Failed to load profiles', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await createProfile(name);
      setProfiles((prev) => [...prev, created as Profile]);
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
      setProfiles((prev) =>
        prev.map((p) => ({ ...p, active: p.name === name }))
      );
    } catch (err) {
      console.error('Failed to activate profile', err);
    }
  }

  async function handleDelete(name: string) {
    try {
      await deleteProfile(name);
      setProfiles((prev) => prev.filter((p) => p.name !== name));
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
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: '#2a2a35',
                border: '1px solid #2a2a35',
                color: '#ffffff',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a35'; }}
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
            <ProfileCard
              key={profile.name}
              profile={profile}
              onActivate={() => handleActivate(profile.name)}
              onEdit={() => {/* edit not implemented */}}
              onExport={() => handleExport(profile.name)}
              onDelete={() => setDeleteTarget(profile.name)}
            />
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
