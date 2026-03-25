'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/shared/button';
import { ModelSelector } from '@/components/settings/model-selector';
import { EnvVarsEditor } from '@/components/settings/env-vars-editor';
import { HooksEditor } from '@/components/settings/hooks-editor';
import { fetchSettings, updateSettings, fetchEnvVars, setEnvVar, removeEnvVar } from '@/lib/api-client';

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
  const [settings, setSettings] = useState<Settings>({});
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [model, setModel] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, env] = await Promise.all([fetchSettings(), fetchEnvVars()]);
        const typed = s as Settings;
        setSettings(typed);
        setModel((typed.model as string) ?? '');
        setEnvVars(env as Record<string, string>);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveModel() {
    setSaving(true);
    try {
      await updateSettings({ model });
      setSettings((prev) => ({ ...prev, model }));
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
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Model Section */}
          <section
            className="rounded-xl p-5"
            style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
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
            className="rounded-xl p-5"
            style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
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
            className="rounded-xl p-5"
            style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#ffffff' }}>
              Hooks
            </h2>
            <HooksEditor hooks={hooks} />
          </section>
        </div>
      )}
    </div>
  );
}
