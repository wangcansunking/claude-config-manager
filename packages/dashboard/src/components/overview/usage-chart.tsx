'use client';

export interface UsageChartProps {
  title: string;
  entries: { name: string; usageCount: number; lastUsedAt: number }[];
  barColor: string;
  maxItems?: number;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const d = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function UsageChart({ title, entries, barColor, maxItems = 8 }: UsageChartProps) {
  const visible = entries.slice(0, maxItems);
  const maxCount = visible.length > 0 ? visible[0].usageCount : 0;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
      >
        <h3 className="text-lg" style={{ color: '#f7f8f8', fontWeight: 510 }}>{title}</h3>
      </div>
      {visible.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm" style={{ color: '#8a8f98' }}>No data yet.</p>
        </div>
      ) : (
        <div className="py-1">
          {visible.map((entry) => {
            const pct = maxCount > 0 ? (entry.usageCount / maxCount) * 100 : 0;
            const relTime = formatRelativeTime(entry.lastUsedAt);
            return (
              <div
                key={entry.name}
                className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[#28282c]"
              >
                <span
                  className="font-mono text-xs shrink-0 truncate"
                  style={{ color: '#7170ff', width: '180px' }}
                  title={entry.name}
                >
                  {entry.name.length > 26 ? entry.name.slice(0, 24) + '...' : entry.name}
                </span>
                <div
                  className="flex-1 h-5 rounded overflow-hidden"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                >
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: barColor,
                      opacity: 0.85,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span
                  className="text-xs shrink-0 text-right"
                  style={{ color: '#d0d6e0', width: '44px', fontWeight: 510 }}
                >
                  {entry.usageCount}
                </span>
                {relTime && (
                  <span
                    className="text-xs shrink-0 text-right"
                    style={{ color: '#62666d', width: '64px' }}
                  >
                    {relTime}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
