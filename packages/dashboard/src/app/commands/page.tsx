'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { Tag } from '@/components/shared/tag';
import { fetchCommands } from '@/lib/api-client';

interface Command {
  name: string;
  description?: string;
  filePath: string;
  content?: string;
  args?: string[];
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Command | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCommands();
        setCommands(data as Command[]);
      } catch (err) {
        console.error('Failed to load commands', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          {commands.map((cmd, i) => (
            <div
              key={cmd.name}
              className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors"
              style={{ borderBottom: i < commands.length - 1 ? '1px solid #2a2a35' : 'none' }}
              onClick={() => setSelected(cmd)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = '#252530';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
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
          ))}
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
