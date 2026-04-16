'use client';

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
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <p
        className="text-xs uppercase tracking-wider mb-2"
        style={{ color: '#8a8f98', fontWeight: 510 }}
      >
        {title}
      </p>
      <p
        className="text-3xl mb-1"
        style={{ color: '#f7f8f8', fontWeight: 510 }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: '#d0d6e0' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
