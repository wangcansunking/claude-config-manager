'use client';

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
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider" style={{ color: '#8a8f98', fontWeight: 510 }}>
        Default Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{
          backgroundColor: '#191a1b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f7f8f8',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#5e6ad2';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        <option value="">-- Select a model --</option>
        {COMMON_MODELS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        {value && !COMMON_MODELS.includes(value) && (
          <option value={value}>{value}</option>
        )}
      </select>
      {/* Custom model input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type a custom model ID..."
        className="w-full px-3 py-2 rounded-md text-sm outline-none"
        style={{
          backgroundColor: '#191a1b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f7f8f8',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#5e6ad2';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      />
    </div>
  );
}
