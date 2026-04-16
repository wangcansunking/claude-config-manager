interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'green' | 'blue' | 'orange' | 'purple';
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
    >
      <p
        className="text-xs uppercase tracking-wider mb-2"
        style={{ color: 'var(--text-muted)', fontWeight: 510 }}
      >
        {title}
      </p>
      <p
        className="text-3xl mb-1"
        style={{ color: 'var(--text-primary)', fontWeight: 510 }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
