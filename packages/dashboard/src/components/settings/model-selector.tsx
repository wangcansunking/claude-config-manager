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
      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#636e72' }}>
        Default Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          backgroundColor: '#2a2a35',
          border: '1px solid #2a2a35',
          color: '#ffffff',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6c5ce7';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#2a2a35';
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
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          backgroundColor: '#2a2a35',
          border: '1px solid #2a2a35',
          color: '#ffffff',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6c5ce7';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#2a2a35';
        }}
      />
    </div>
  );
}
