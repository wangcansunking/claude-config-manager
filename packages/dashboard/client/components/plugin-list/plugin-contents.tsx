import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MarkdownViewer } from '@/components/shared/markdown-viewer';
import { Tag } from '@/components/shared/tag';
import { fetchSkillContent } from '@/lib/api-client';

interface CommandOrSkill {
  name: string;
  description?: string;
  filePath: string;
}

interface McpServer {
  name: string;
  type: 'stdio' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

interface PluginContentsData {
  plugin: string;
  version: string;
  commands: CommandOrSkill[];
  skills: CommandOrSkill[];
  mcpServers: McpServer[];
}

function buildMcpShellCommand(server: McpServer): string {
  if (server.type === 'http') {
    return `# HTTP MCP server — connect via an MCP client:\n# url: ${server.url ?? ''}`;
  }
  const parts = [server.command ?? '', ...(server.args ?? [])];
  return parts.filter(Boolean).join(' ');
}

function CopyChip({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-bg-hover"
      style={{
        fontSize: '11px',
        color: copied ? 'var(--status-green)' : 'var(--text-muted)',
        border: '1px solid var(--card-border)',
      }}
      title={copied ? 'Copied!' : text}
    >
      {copied ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {copied ? 'Copied' : label}
    </button>
  );
}

function ClickableRow({
  primary,
  secondary,
  onClick,
}: {
  primary: string;
  secondary?: string;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-bg-hover"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <code className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
        {primary}
      </code>
      {secondary && (
        <p className="text-xs mt-1 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
          {secondary.replace(/^"|"$/g, '')}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3
        className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          {count}
        </span>
      </h3>
      {children}
    </section>
  );
}

interface PreviewState {
  kind: 'command' | 'skill';
  name: string;
  filePath: string;
}

function PreviewOverlay({
  preview,
  pluginName,
  onClose,
}: {
  preview: PreviewState;
  pluginName: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContent(null);
    fetchSkillContent(preview.filePath)
      .then(({ content }) => {
        if (!cancelled) setContent(content);
      })
      .catch(() => {
        if (!cancelled) setContent('*Failed to load content*');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preview.filePath]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ backgroundColor: 'var(--bg-primary)', zIndex: 60 }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0 gap-3"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <code
            className="text-base font-mono font-medium truncate"
            style={{ color: 'var(--accent-light)' }}
          >
            {preview.kind === 'command' ? `/${preview.name}` : preview.name}
          </code>
          <Tag label={preview.kind === 'command' ? 'Command' : 'Skill'} variant="blue" />
          <Tag label={pluginName} variant="gray" />
          <Tag label="Read-only" variant="orange" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <code className="text-xs font-mono hidden lg:block" style={{ color: 'var(--text-muted)' }}>
            {preview.filePath}
          </code>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-bg-hover"
            style={{ color: 'var(--text-secondary)' }}
            onClick={onClose}
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="max-w-4xl mx-auto text-center py-12">
            <p style={{ color: 'var(--text-muted)' }}>Loading content...</p>
          </div>
        ) : (
          <MarkdownViewer
            content={content ?? '*No content available*'}
            className="max-w-4xl mx-auto skill-markdown"
          />
        )}
      </div>
    </div>
  );
}

export function PluginContents({ pluginName }: { pluginName: string }) {
  const [data, setData] = useState<PluginContentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setPreview(null);
    fetch(`/api/plugins/${encodeURIComponent(pluginName)}/contents`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PluginContentsData>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pluginName]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg h-14 animate-pulse"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Could not load plugin contents{error ? ` (${error})` : ''}.
      </p>
    );
  }

  const { commands, skills, mcpServers } = data;
  const hasAny = commands.length > 0 || skills.length > 0 || mcpServers.length > 0;
  if (!hasAny) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        This plugin does not expose any commands, skills, or MCP servers.
      </p>
    );
  }

  return (
    <>
      {commands.length > 0 && (
        <Section title="Commands" count={commands.length}>
          <div className="space-y-2">
            {commands.map((c) => (
              <ClickableRow
                key={c.filePath}
                primary={`/${c.name}`}
                secondary={c.description}
                onClick={() =>
                  setPreview({ kind: 'command', name: c.name, filePath: c.filePath })
                }
              />
            ))}
          </div>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills" count={skills.length}>
          <div className="space-y-2">
            {skills.map((s) => (
              <ClickableRow
                key={s.filePath}
                primary={s.name}
                secondary={s.description}
                onClick={() => setPreview({ kind: 'skill', name: s.name, filePath: s.filePath })}
              />
            ))}
          </div>
        </Section>
      )}

      {mcpServers.length > 0 && (
        <Section title="MCP Servers" count={mcpServers.length}>
          <div className="space-y-2">
            {mcpServers.map((s) => {
              const shellCmd = buildMcpShellCommand(s);
              return (
                <div
                  key={s.name}
                  className="rounded-lg px-3 py-2 space-y-2"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <code
                        className="text-xs font-mono font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {s.name}
                      </code>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--border)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {s.type}
                      </span>
                    </div>
                    {s.type === 'stdio' && shellCmd && <CopyChip text={shellCmd} label="Copy" />}
                    {s.type === 'http' && s.url && <CopyChip text={s.url} label="Copy URL" />}
                  </div>
                  <code
                    className="block text-xs font-mono px-2 py-1.5 rounded break-all whitespace-pre-wrap"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {s.type === 'http' ? s.url : shellCmd}
                  </code>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Run this in your terminal to inspect the server&apos;s tools and prompts.
                  </p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {preview &&
        createPortal(
          <PreviewOverlay
            preview={preview}
            pluginName={pluginName}
            onClose={() => setPreview(null)}
          />,
          document.body,
        )}
    </>
  );
}
