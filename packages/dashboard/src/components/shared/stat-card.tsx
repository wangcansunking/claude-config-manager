'use client';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: 'green' | 'blue' | 'orange' | 'purple';
}

const colorMap: Record<string, string> = {
  green: '#00b894',
  blue: '#0984e3',
  orange: '#e17055',
  purple: '#6c5ce7',
};

export function StatCard({ title, value, subtitle, color = 'purple' }: StatCardProps) {
  const accentColor = colorMap[color] ?? colorMap['purple'];

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: '#636e72' }}
      >
        {title}
      </p>
      <p
        className="text-3xl font-bold mb-1"
        style={{ color: accentColor }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: '#b2bec3' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
