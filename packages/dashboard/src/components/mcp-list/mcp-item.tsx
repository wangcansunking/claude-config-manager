'use client';

import { Tag } from '../shared/tag';

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpServer {
  name: string;
  config: McpServerConfig;
  enabled?: boolean;
  source?: 'user' | 'system';
}

interface McpItemProps {
  server: McpServer;
  onClick: () => void;
}

export function McpItem({ server, onClick }: McpItemProps) {
  const isEnabled = server.enabled !== false;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: isEnabled ? 'var(--status-green)' : 'var(--text-muted)' }}
      />

      {/* Name + command */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
          {server.name}
        </p>
        <p className="text-xs font-mono truncate mt-0.5" style={{ color: 'var(--text-faint)' }}>
          {server.config.command}
          {server.config.args && server.config.args.length > 0
            ? ' ' + server.config.args.join(' ')
            : ''}
        </p>
      </div>

      {/* Status tag */}
      <Tag
        label={isEnabled ? 'Connected' : 'Disabled'}
        variant={isEnabled ? 'green' : 'gray'}
      />

      {/* Chevron */}
      <svg
        className="w-4 h-4 shrink-0"
        style={{ color: 'var(--text-faint)' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
