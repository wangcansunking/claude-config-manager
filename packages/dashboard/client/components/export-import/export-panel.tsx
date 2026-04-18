import { useState } from 'react';
import { Button } from '../shared/button';
import { Select } from '../shared/select';
import { exportProfile } from '@/lib/api-client';

interface Profile {
  name: string;
}

interface ExportPanelProps {
  profiles: Profile[];
}

type ExportFormat = 'json' | 'yaml';

export function ExportPanel({ profiles }: ExportPanelProps) {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState({
    plugins: true,
    mcpServers: true,
    commands: true,
    settings: true,
    credentials: false,
  });

  function toggleOption(key: keyof typeof options) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleExport() {
    if (!selectedProfile) return;
    setExporting(true);
    try {
      const { data } = await exportProfile(selectedProfile);
      // YAML conversion would require a lib, so we output JSON for both formats
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/yaml',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedProfile}-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  }

  const profileOptions = [
    { value: '', label: 'Select a profile...' },
    ...profiles.map((p) => ({ value: p.name, label: p.name })),
  ];

  return (
    <div
      className="rounded-lg p-5 h-full"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <h2 className="text-base mb-4" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
        Export
      </h2>

      {/* Profile selector */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontWeight: 510 }}>
          Profile
        </label>
        <Select
          value={selectedProfile}
          onChange={setSelectedProfile}
          options={profileOptions}
          placeholder="Select a profile..."
        />
      </div>

      {/* Include options */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontWeight: 510 }}>
          Include
        </label>
        <div className="space-y-2">
          {(Object.keys(options) as Array<keyof typeof options>).map((key) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggleOption(key)}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--accent)' }}
              />
              <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                {key === 'mcpServers' ? 'MCP Servers' : key}
              </span>
              {key === 'credentials' && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(255, 71, 87, 0.15)', color: 'var(--status-red)' }}
                >
                  sensitive
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Format selector */}
      <div className="mb-5">
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)', fontWeight: 510 }}>
          Format
        </label>
        <div className="flex gap-2">
          {(['json', 'yaml'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-4 py-1.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: format === f ? 'var(--accent)' : 'var(--input-bg)',
                color: format === f ? '#fff' : 'var(--text-secondary)',
                border: format === f ? 'none' : '1px solid var(--card-border)',
                fontWeight: 510,
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        onClick={handleExport}
        disabled={!selectedProfile || exporting}
      >
        {exporting ? 'Exporting...' : 'Export to File'}
      </Button>
    </div>
  );
}
