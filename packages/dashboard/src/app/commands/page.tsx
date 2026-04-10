'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/layout/header';
import { Tag } from '@/components/shared/tag';
import { useCommands } from '@/lib/use-data';
import { updateSkillContent } from '@/lib/api-client';

interface Command {
  name: string;
  description?: string;
  filePath: string;
  content?: string;
  args?: string[];
  source?: 'user' | 'system';
}

function CollapsibleSection({ icon, label, count, children }: { icon: string; label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}>
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#252530]"
        style={{ borderBottom: open ? '1px solid #2a2a35' : 'none' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold" style={{ color: label === 'User' ? '#a29bfe' : '#636e72' }}>{label}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#2a2a35', color: '#b2bec3' }}>{count}</span>
        </div>
        <svg className="w-4 h-4 transition-transform" style={{ color: '#636e72', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div>{children}</div>}
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
  const { data: commandsRaw, isLoading: loading, mutate } = useCommands();
  const commands = (commandsRaw ?? []) as Command[];
  const [selected, setSelected] = useState<Command | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Split by source
  const userCommands = commands.filter((c) => c.source === 'user');
  const systemCommands = commands.filter((c) => c.source !== 'user');

  async function handleSave() {
    if (!selected) return;
    try {
      await updateSkillContent(selected.filePath, editContent);
      setSelected({ ...selected, content: editContent });
      setEditing(false);
      mutate();
    } catch (err) {
      console.error('Failed to save', err);
    }
  }

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
            <CollapsibleSection icon="👤" label="User" count={userCommands.length}>
              {userCommands.map((cmd, i) => (
                <CommandRow key={cmd.name} cmd={cmd} isLast={i === userCommands.length - 1} onClick={() => setSelected(cmd)} />
              ))}
            </CollapsibleSection>
          )}

          {/* System Commands Section */}
          {systemCommands.length > 0 && (
            <CollapsibleSection icon="🔧" label="System" count={systemCommands.length}>
              {systemCommands.map((cmd, i) => (
                <CommandRow key={cmd.name} cmd={cmd} isLast={i === systemCommands.length - 1} onClick={() => setSelected(cmd)} />
              ))}
            </CollapsibleSection>
          )}
        </div>
      )}

      {/* Fullscreen Command Viewer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: '#0f0f14' }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid #2a2a35', backgroundColor: '#16161d' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <code className="text-base font-mono font-semibold" style={{ color: '#a29bfe' }}>
                /{selected.name}
              </code>
              <Tag label={selected.source === 'user' ? 'User' : 'System'} variant={selected.source === 'user' ? 'purple' : 'gray'} />
              {selected.description && (
                <span className="text-xs truncate" style={{ color: '#636e72' }}>
                  — {selected.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <code className="text-xs font-mono hidden lg:block" style={{ color: '#636e72' }}>
                {selected.filePath}
              </code>
              {selected.source === 'user' && !editing && (
                <button
                  onClick={() => { setEditing(true); setEditContent(selected.content ?? ''); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#2a2a35]"
                  style={{ color: '#a29bfe' }}
                >
                  Edit
                </button>
              )}
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#2a2a35]"
                style={{ color: '#b2bec3' }}
                onClick={() => { setSelected(null); setEditing(false); }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Markdown content */}
          <div className="flex-1 overflow-auto px-8 py-6">
            {editing ? (
              <div className="max-w-4xl mx-auto flex flex-col h-full">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 w-full p-4 rounded-lg font-mono text-sm resize-none outline-none"
                  style={{ backgroundColor: '#16161d', color: '#b2bec3', border: '1px solid #2a2a35', minHeight: '500px' }}
                />
                <div className="flex gap-3 mt-4 justify-end">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm btn-secondary">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm btn-primary">Save</button>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto skill-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selected.content ?? '*No content available*'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
