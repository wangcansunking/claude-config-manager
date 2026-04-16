'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const sessions = ((sessionsRaw ?? []) as SessionInfo[])
    .slice()
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 5);

  return (
    <div className="rounded-xl overflow-hidden bg-[#1e1e28] border border-[#2a2a35]">
      <div className="px-5 py-3 border-b border-[#2a2a35] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
        <button
          className="text-xs transition-colors hover:text-white"
          style={{ color: '#636e72' }}
          onClick={() => router.push('/sessions')}
        >
          View all
        </button>
      </div>

      {isLoading ? (
        <div className="px-5 py-6">
          <p className="text-sm" style={{ color: '#636e72' }}>Loading...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm" style={{ color: '#636e72' }}>No sessions found.</p>
        </div>
      ) : (
        <div>
          {sessions.map((session, i) => (
            <div
              key={session.sessionId}
              className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-[#252530]"
              style={{ borderBottom: i < sessions.length - 1 ? '1px solid #2a2a35' : 'none' }}
              onClick={() => router.push('/sessions')}
            >
              {/* Status dot */}
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: session.alive ? '#00b894' : '#636e72' }}
              />

              <div className="flex-1 min-w-0">
                {/* Project path */}
                <p
                  className="font-mono text-xs truncate mb-0.5"
                  style={{ color: '#b2bec3' }}
                  title={session.projectDir ?? session.cwd}
                >
                  {truncatePath(session.projectDir ?? session.cwd)}
                </p>

                {/* Relative time + last message */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs shrink-0" style={{ color: '#636e72' }}>
                    {formatRelativeTime(session.startedAt)}
                  </span>
                  {session.lastMessage && (
                    <span className="text-xs truncate" style={{ color: '#636e72' }}>
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
