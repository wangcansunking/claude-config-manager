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
      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#252530]"
      style={{ borderBottom: '1px solid #2a2a35' }}
      onClick={onClick}
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: isEnabled ? '#00b894' : '#ff4757' }}
      />

      {/* Name + command */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
          {server.name}
        </p>
        <p className="text-xs font-mono truncate mt-0.5" style={{ color: '#636e72' }}>
          {server.config.command}
          {server.config.args && server.config.args.length > 0
            ? ' ' + server.config.args.join(' ')
            : ''}
        </p>
      </div>

      {/* Status tag */}
      <Tag
        label={isEnabled ? 'Connected' : 'Disabled'}
        variant={isEnabled ? 'green' : 'red'}
      />

      {/* Chevron */}
      <svg
        className="w-4 h-4 shrink-0"
        style={{ color: '#636e72' }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}
