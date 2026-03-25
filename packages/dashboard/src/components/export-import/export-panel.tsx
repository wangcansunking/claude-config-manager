'use client';

import { useState } from 'react';
import { Button } from '../shared/button';
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
      const data = await exportProfile(selectedProfile);
      const content = format === 'json'
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data, null, 2); // yaml conversion would require a lib
      const blob = new Blob([content], {
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

  const selectStyle = {
    backgroundColor: '#2a2a35',
    border: '1px solid #2a2a35',
    color: '#ffffff',
  };

  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
    >
      <h2 className="text-base font-semibold mb-4" style={{ color: '#ffffff' }}>
        Export
      </h2>

      {/* Profile selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
          Profile
        </label>
        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a35'; }}
        >
          <option value="">Select a profile...</option>
          {profiles.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Include options */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
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
                style={{ accentColor: '#6c5ce7' }}
              />
              <span className="text-sm capitalize" style={{ color: '#b2bec3' }}>
                {key === 'mcpServers' ? 'MCP Servers' : key}
              </span>
              {key === 'credentials' && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(255, 71, 87, 0.15)', color: '#ff4757' }}
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
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
          Format
        </label>
        <div className="flex gap-2">
          {(['json', 'yaml'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: format === f ? '#6c5ce7' : '#2a2a35',
                color: format === f ? '#ffffff' : '#b2bec3',
                border: 'none',
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
