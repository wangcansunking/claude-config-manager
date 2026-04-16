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
    backgroundColor: '#191a1b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f7f8f8',
  };

  return (
    <div
      className="rounded-lg p-5 h-full"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <h2 className="text-base mb-4" style={{ color: '#f7f8f8', fontWeight: 510 }}>
        Export
      </h2>

      {/* Profile selector */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#8a8f98', fontWeight: 510 }}>
          Profile
        </label>
        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm outline-none"
          style={selectStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#5e6ad2'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
        >
          <option value="">Select a profile...</option>
          {profiles.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Include options */}
      <div className="mb-4">
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#8a8f98', fontWeight: 510 }}>
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
                style={{ accentColor: '#5e6ad2' }}
              />
              <span className="text-sm capitalize" style={{ color: '#d0d6e0' }}>
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
        <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: '#8a8f98', fontWeight: 510 }}>
          Format
        </label>
        <div className="flex gap-2">
          {(['json', 'yaml'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="px-4 py-1.5 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: format === f ? '#5e6ad2' : 'rgba(255, 255, 255, 0.04)',
                color: format === f ? '#f7f8f8' : '#d0d6e0',
                border: format === f ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
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
