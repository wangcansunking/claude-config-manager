import { useNavigate } from 'react-router-dom';
import { useSessions } from '@/lib/use-data';

interface SessionInfo {
  sessionId: string;
  cwd: string;
  startedAt: number;
  alive: boolean;
  lastMessage?: string;
  projectDir?: string;
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

function truncatePath(path: string, maxLen = 48): string {
  if (!path) return '';
  if (path.length <= maxLen) return path;
  return '...' + path.slice(path.length - maxLen + 3);
}

function truncateMessage(msg: string, maxLen = 80): string {
  if (!msg) return '';
  const oneLine = msg.replace(/\n/g, ' ').trim();
  if (oneLine.length <= maxLen) return oneLine;
  return oneLine.slice(0, maxLen) + '...';
}

export function RecentSessions() {
  const { data: sessionsRaw, isLoading } = useSessions();
  const navigate = useNavigate();

  const sessions = ((sessionsRaw ?? []) as SessionInfo[])
    .slice()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 5);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-lg" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>Recent Sessions</h3>
        <button
          className="text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => navigate('/activity')}
        >
          View all
        </button>
      </div>

      {isLoading ? (
        <div className="px-5 py-6">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No sessions found.</p>
        </div>
      ) : (
        <div>
          {sessions.map((session, i) => (
            <div
              key={session.sessionId}
              className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors"
              style={{ borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none' }}
              onClick={() => navigate('/activity')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              {/* Status dot */}
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: session.alive ? 'var(--status-green)' : 'var(--text-muted)' }}
              />

              <div className="flex-1 min-w-0">
                {/* Project path */}
                <p
                  className="font-mono text-xs truncate mb-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                  title={session.projectDir ?? session.cwd}
                >
                  {truncatePath(session.projectDir ?? session.cwd)}
                </p>

                {/* Relative time + last message */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>
                    {formatRelativeTime(session.startedAt)}
                  </span>
                  {session.lastMessage && (
                    <span className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                      {truncateMessage(session.lastMessage)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
