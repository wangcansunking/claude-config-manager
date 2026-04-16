import { useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options, placeholder, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? 'Select...'}</span>
        <svg className="w-4 h-4 shrink-0 ml-2" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden shadow-xl max-h-60 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-strong)' }}
        >
          {options.map(opt => (
            <button key={opt.value}
              type="button"
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: opt.value === value ? 'var(--bg-hover)' : 'transparent',
                color: opt.value === value ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = opt.value === value ? 'var(--bg-hover)' : 'transparent'; }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
