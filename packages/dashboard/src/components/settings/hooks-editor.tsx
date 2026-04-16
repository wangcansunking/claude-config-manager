'use client';

import { Tag } from '../shared/tag';

interface HookEntry {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

interface HooksEditorProps {
  hooks: Record<string, HookEntry[]>;
}

const EVENT_COLORS: Record<string, 'green' | 'blue' | 'orange' | 'purple' | 'yellow' | 'pink'> = {
  'PreToolUse': 'blue',
  'PostToolUse': 'green',
  'Notification': 'yellow',
  'Stop': 'orange',
  'SubagentStop': 'pink',
};

export function HooksEditor({ hooks }: HooksEditorProps) {
  const entries = Object.entries(hooks);

  if (entries.length === 0) {
    return <p className="text-sm" style={{ color: '#8a8f98' }}>No hooks configured.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([event, hookList]) => (
        <div key={event}>
          <div className="flex items-center gap-2 mb-2">
            <Tag
              label={event}
              variant={EVENT_COLORS[event] ?? 'gray'}
            />
          </div>
          <div className="space-y-2">
            {hookList.map((hook, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                <code className="block text-xs font-mono" style={{ color: '#7170ff' }}>
                  {hook.command}
                  {hook.args && hook.args.length > 0 ? ' ' + hook.args.join(' ') : ''}
                </code>
                {hook.timeout !== undefined && (
                  <p className="text-xs mt-1" style={{ color: '#8a8f98' }}>
                    Timeout: {hook.timeout}ms
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
