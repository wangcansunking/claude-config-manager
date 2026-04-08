'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { Tag } from '@/components/shared/tag';
import { useCommands } from '@/lib/use-data';

interface Command {
  name: string;
  description?: string;
  filePath: string;
  content?: string;
  args?: string[];
  source?: 'user' | 'system';
}

function SectionHeading({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <h3 className="text-sm font-semibold" style={{ color: label === 'User' ? '#a29bfe' : '#636e72' }}>
        {label}
      </h3>
      <span
        className="text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor: '#2a2a35', color: '#b2bec3' }}
      >
        {count}
      </span>
    </div>
  );
}

function CommandRow({ cmd, isLast, onClick }: { cmd: Command; isLast: boolean; onClick: () => void }) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[#252530]"
      style={{ borderBottom: isLast ? 'none' : '1px solid #2a2a35' }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code
            className="text-sm font-mono font-semibold"
            style={{ color: '#a29bfe' }}
          >
            /{cmd.name}
          </code>
          {cmd.args && cmd.args.length > 0 && (
            <span className="text-xs font-mono" style={{ color: '#636e72' }}>
              {cmd.args.map((a) => `[${a}]`).join(' ')}
            </span>
          )}
        </div>
        {cmd.description && (
          <p className="text-sm" style={{ color: '#b2bec3' }}>
            {cmd.description}
          </p>
        )}
      </div>
      <svg
        className="w-4 h-4 shrink-0 mt-0.5"
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

export default function CommandsPage() {
  const { data: commandsRaw, isLoading: loading } = useCommands();
  const commands = (commandsRaw ?? []) as Command[];
  const [selected, setSelected] = useState<Command | null>(null);

  // Split by source
  const userCommands = commands.filter((c) => c.source === 'user');
  const systemCommands = commands.filter((c) => c.source !== 'user');

  return (
    <div>
      <Header title="Commands" />

      {loading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : commands.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
            No custom commands found.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Commands Section */}
          {userCommands.length > 0 && (
            <div className="mb-8">
              <SectionHeading icon={'\ud83d\udc64'} label="User" count={userCommands.length} />
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                {userCommands.map((cmd, i) => (
                  <CommandRow
                    key={cmd.name}
                    cmd={cmd}
                    isLast={i === userCommands.length - 1}
                    onClick={() => setSelected(cmd)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* System Commands Section */}
          {systemCommands.length > 0 && (
            <div>
              <SectionHeading icon={'\ud83d\udd27'} label="System" count={systemCommands.length} />
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                {systemCommands.map((cmd, i) => (
                  <CommandRow
                    key={cmd.name}
                    cmd={cmd}
                    isLast={i === systemCommands.length - 1}
                    onClick={() => setSelected(cmd)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `/${selected.name}` : ''}
        subtitle={selected?.description}
      >
        {selected && (
          <div className="space-y-5">
            {selected.description && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                  Description
                </h3>
                <p className="text-sm" style={{ color: '#b2bec3' }}>{selected.description}</p>
              </section>
            )}

            {selected.args && selected.args.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                  Arguments
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selected.args.map((arg) => (
                    <Tag key={arg} label={arg} variant="yellow" />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                File Path
              </h3>
              <code className="text-xs font-mono break-all" style={{ color: '#636e72' }}>
                {selected.filePath}
              </code>
            </section>

            {selected.content && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                  Content
                </h3>
                <pre
                  className="text-xs rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap"
                  style={{ backgroundColor: '#16161d', color: '#b2bec3' }}
                >
                  {selected.content}
                </pre>
              </section>
            )}
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
