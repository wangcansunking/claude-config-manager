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
      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#28282c]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onClick={onClick}
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: isEnabled ? '#27a644' : '#8a8f98' }}
      />

      {/* Name + command */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: '#f7f8f8', fontWeight: 510 }}>
          {server.name}
        </p>
        <p className="text-xs font-mono truncate mt-0.5" style={{ color: '#62666d' }}>
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
        style={{ color: '#62666d' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
