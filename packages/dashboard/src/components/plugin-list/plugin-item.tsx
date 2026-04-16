'use client';

import { Tag } from '../shared/tag';

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
      className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#28282c]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: '#5e6ad2' }}
      >
        {plugin.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: '#f7f8f8', fontWeight: 510 }}>
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
