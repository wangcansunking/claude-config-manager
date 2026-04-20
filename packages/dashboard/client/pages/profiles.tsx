
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/shared/button';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { ProfileCard } from '@/components/profile-grid/profile-card';
import type { Profile } from '@/components/profile-grid/profile-card';
import { ExportPanel } from '@/components/export-import/export-panel';
import { ImportPanel } from '@/components/export-import/import-panel';
import { activateProfile, deleteProfile, exportProfile } from '@/lib/api-client';
import { useProfiles } from '@/lib/use-data';

type ProfileTabId = 'profiles' | 'export-import';

export default function ProfilesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: profilesRaw, isLoading: loading, mutate } = useProfiles();
  const profiles = (profilesRaw ?? []) as Profile[];
  const [profileTab, setProfileTab] = useState<ProfileTabId>('profiles');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
      const { data } = await exportProfile(name);
      const blob = new Blob([data], { type: 'application/json' });
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
      <Header title={t('profiles.title')}>
        {profileTab === 'profiles' && profiles.length > 0 && (
          <Button variant="primary" size="md" onClick={() => navigate('/config')}>
            {t('profiles.saveCurrent')}
          </Button>
        )}
      </Header>

      {/* Tabs: Profiles | Export / Import */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {([
          { id: 'profiles' as ProfileTabId, label: t('profiles.tabs.profiles') },
          { id: 'export-import' as ProfileTabId, label: t('profiles.tabs.exportImport') },
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
      ) : loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : profiles.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border, var(--card-border))' }}
        >
          <h3 className="text-base mb-2" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
            {t('profiles.emptyTitle')}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {t('profiles.emptyBody')}
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/config')}>
            {t('profiles.saveCurrent')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.name}
              profile={profile}
              onActivate={() => handleActivate(profile.name)}
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
