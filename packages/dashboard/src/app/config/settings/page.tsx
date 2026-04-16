'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/shared/button';
import { ModelSelector } from '@/components/settings/model-selector';
import { EnvVarsEditor } from '@/components/settings/env-vars-editor';
import { HooksEditor } from '@/components/settings/hooks-editor';
import { updateSettings, fetchEnvVars, setEnvVar, removeEnvVar } from '@/lib/api-client';
import { useSettings } from '@/lib/use-data';

interface HookEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

interface Settings {
  model?: string;
  hooks?: Record<string, HookEntry[]>;
  [key: string]: unknown;
}

export default function SettingsPage() {
  const { data: settingsRaw, isLoading: settingsLoading, mutate: mutateSettings } = useSettings();
  const settings = (settingsRaw ?? {}) as Settings;
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [envLoading, setEnvLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState('');

  const loading = settingsLoading || envLoading;

  // Load env vars (not covered by SWR hooks since fetchEnvVars is separate)
  useEffect(() => {
    async function loadEnv() {
      try {
        const env = await fetchEnvVars();
        setEnvVars(env as Record<string, string>);
      } catch (err) {
        console.error('Failed to load env vars', err);
      } finally {
        setEnvLoading(false);
      }
    }
    loadEnv();
  }, []);

  // Sync model from settings when settings load
  useEffect(() => {
    if (settings.model !== undefined) {
      setModel((settings.model as string) ?? '');
    }
  }, [settings.model]);

  async function handleSaveModel() {
    setSaving(true);
    try {
      await updateSettings({ model });
      mutateSettings();
    } catch (err) {
      console.error('Failed to save model', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEnvVar(key: string, value: string) {
    try {
      await setEnvVar(key, value);
      setEnvVars((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('Failed to set env var', err);
    }
  }

  async function handleRemoveEnvVar(key: string) {
    try {
      await removeEnvVar(key);
      setEnvVars((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      console.error('Failed to remove env var', err);
    }
  }

  const hooks = (settings.hooks ?? {}) as Record<string, HookEntry[]>;

  return (
    <div>
      <Header title="Settings" />

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Model Section */}
          <section
            className="rounded-lg p-5"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <h2 className="text-sm mb-4" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
              Model Configuration
            </h2>
            <ModelSelector value={model} onChange={setModel} />
            <div className="mt-4">
              <Button variant="primary" size="md" onClick={handleSaveModel} disabled={saving}>
                {saving ? 'Saving...' : 'Save Model'}
              </Button>
            </div>
          </section>

          {/* Environment Variables */}
          <section
            className="rounded-lg p-5"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <h2 className="text-sm mb-4" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
              Environment Variables
            </h2>
            <EnvVarsEditor
              vars={envVars}
              onAdd={handleAddEnvVar}
              onRemove={handleRemoveEnvVar}
            />
          </section>

          {/* Hooks */}
          <section
            className="rounded-lg p-5"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <h2 className="text-sm mb-4" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
              Hooks
            </h2>
            <HooksEditor hooks={hooks} />
          </section>
        </div>
      )}
    </div>
  );
}
