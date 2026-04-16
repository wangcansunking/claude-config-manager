'use client';

import { Select } from '../shared/select';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_MODELS = [
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
];

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const options = [
    { value: '', label: '-- Select a model --' },
    ...COMMON_MODELS.map((m) => ({ value: m, label: m })),
    ...(value && !COMMON_MODELS.includes(value) ? [{ value, label: value }] : []),
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 510 }}>
        Default Model
      </label>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder="-- Select a model --"
      />
      {/* Custom model input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type a custom model ID..."
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--card-border)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--card-border)';
        }}
      />
    </div>
  );
}
