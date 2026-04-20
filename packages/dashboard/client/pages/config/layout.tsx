import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/shared/button';
import { createProfile } from '@/lib/api-client';
import { useProfiles } from '@/lib/use-data';

const tabs = [
  { key: 'plugins', href: '/config/plugins' },
  { key: 'mcp', href: '/config/mcp' },
  { key: 'skills', href: '/config/skills' },
  { key: 'commands', href: '/config/commands' },
  { key: 'settings', href: '/config/settings' },
] as const;

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: mutateProfiles } = useProfiles();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function closeDialog() {
    setShowSaveDialog(false);
    setProfileName('');
    setProfileDescription('');
    setError(null);
  }

  async function handleSave() {
    const name = profileName.trim();
    if (!name) {
      setError(t('config.saveDialog.nameRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createProfile(name);
      mutateProfiles();
      setToast(t('config.saveDialog.profileSaved', { name }));
      closeDialog();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to create profile', err);
      setError(err instanceof Error ? err.message : t('config.saveDialog.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: 'var(--bg-tertiary)', flex: 1 }}
        >
          {tabs.map(tab => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} to={tab.href}
                className="px-4 py-2 rounded-md text-sm transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-muted)',
                  fontWeight: active ? 510 : 400,
                }}
              >{t(`config.tabs.${tab.key}`)}</Link>
            );
          })}
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowSaveDialog(true)}
        >
          {t('config.saveToProfile')}
        </Button>
      </div>

      {children}

      {/* Save to Profile Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'var(--overlay-bg)' }}
          onClick={closeDialog}
        >
          <div
            className="rounded-lg p-6 w-full max-w-md mx-4"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--card-border)',
              boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg mb-2" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
              {t('config.saveDialog.title')}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('config.saveDialog.body')}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                {t('config.saveDialog.profileName')}
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t('config.saveDialog.namePlaceholder')}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none profile-input"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') closeDialog();
                }}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                {t('config.saveDialog.descriptionLabel')}
              </label>
              <input
                type="text"
                value={profileDescription}
                onChange={(e) => setProfileDescription(e.target.value)}
                placeholder={t('config.saveDialog.descriptionPlaceholder')}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none profile-input"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && (
              <p className="text-xs mb-3" style={{ color: 'var(--accent-red, #e5484d)' }}>
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" size="md" onClick={closeDialog} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={saving || !profileName.trim()}
              >
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 text-sm cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--accent)',
            color: 'var(--text-primary)',
            boxShadow: 'rgba(0,0,0,0.4) 0px 2px 8px',
          }}
          onClick={() => {
            setToast(null);
            navigate('/profiles');
          }}
        >
          {toast} <span style={{ color: 'var(--text-muted)' }}>{t('config.saveDialog.clickToView')}</span>
        </div>
      )}
    </div>
  );
}
