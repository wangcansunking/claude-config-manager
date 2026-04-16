'use client';

type StatusType = 'connected' | 'disconnected' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { color: string; defaultLabel: string }> = {
  connected:    { color: 'var(--status-green)', defaultLabel: 'Connected' },
  disconnected: { color: 'var(--text-muted)', defaultLabel: 'Disconnected' },
  pending:      { color: 'var(--text-secondary)', defaultLabel: 'Pending' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { color, defaultLabel } = statusConfig[status];
  const displayLabel = label ?? defaultLabel;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {displayLabel}
      </span>
    </span>
  );
}
