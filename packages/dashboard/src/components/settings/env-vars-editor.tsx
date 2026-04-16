'use client';

import { useState } from 'react';
import { Button } from '../shared/button';

interface EnvVarsEditorProps {
  vars: Record<string, string>;
  onAdd: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

export function EnvVarsEditor({ vars, onAdd, onRemove }: EnvVarsEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  function handleAdd() {
    const k = newKey.trim();
    const v = newValue.trim();
    if (!k) return;
    onAdd(k, v);
    setNewKey('');
    setNewValue('');
  }

  function toggleShow(key: string) {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const inputStyle = {
    backgroundColor: '#191a1b',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#f7f8f8',
  };

  return (
    <div className="space-y-2">
      {Object.entries(vars).length === 0 ? (
        <p className="text-sm" style={{ color: '#8a8f98' }}>No environment variables set.</p>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          {Object.entries(vars).map(([key, val], i) => (
            <div
              key={key}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: i < Object.entries(vars).length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}
            >
              <code className="text-sm font-mono flex-1" style={{ color: '#7170ff' }}>{key}</code>
              <code className="text-sm font-mono flex-1 text-right" style={{ color: '#d0d6e0' }}>
                {showValues[key] ? val : '--------'}
              </code>
              <button
                onClick={() => toggleShow(key)}
                className="text-xs px-2 py-1 rounded transition-colors"
                style={{ color: '#8a8f98', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                title={showValues[key] ? 'Hide value' : 'Show value'}
              >
                {showValues[key] ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => onRemove(key)}
                className="p-1 rounded transition-colors"
                style={{ color: '#ff4757' }}
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new row */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="KEY"
          className="flex-1 px-3 py-2 rounded-md text-sm font-mono outline-none"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#5e6ad2'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value"
          className="flex-1 px-3 py-2 rounded-md text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#5e6ad2'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button variant="primary" size="md" onClick={handleAdd}>Add</Button>
      </div>
    </div>
  );
}
