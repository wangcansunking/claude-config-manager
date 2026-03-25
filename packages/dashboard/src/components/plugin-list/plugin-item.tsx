'use client';

import { Tag } from '../shared/tag';
import { Button } from '../shared/button';

export interface Plugin {
  name: string;
  version: string;
  marketplace: string;
  enabled: boolean;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

interface PluginItemProps {
  plugin: Plugin;
  onClick: () => void;
}

export function PluginItem({ plugin, onClick }: PluginItemProps) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid #2a2a35' }}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = '#252530';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold"
        style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}
      >
        {plugin.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: '#ffffff' }}>
          {plugin.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Tag label={`v${plugin.version}`} variant="gray" />
          <Tag label={plugin.marketplace} variant="blue" />
          {plugin.enabled ? (
            <Tag label="Enabled" variant="green" />
          ) : (
            <Tag label="Disabled" variant="red" />
          )}
        </div>
      </div>

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
