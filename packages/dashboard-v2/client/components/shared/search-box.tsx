interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }: SearchBoxProps) {
  return (
    <div className="relative">
      <div
        className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
        aria-hidden="true"
      >
        <svg
          className="w-4 h-4"
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 rounded-md text-sm outline-none transition-colors search-input"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}
