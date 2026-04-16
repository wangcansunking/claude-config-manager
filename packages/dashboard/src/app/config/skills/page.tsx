'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/layout/header';
import { SearchBox } from '@/components/shared/search-box';
import { Tag } from '@/components/shared/tag';
import { useSkills } from '@/lib/use-data';
import { updateSkillContent } from '@/lib/api-client';

interface Skill {
  name: string;
  description?: string;
  filePath: string;
  content?: string;
  tags?: string[];
  version?: string;
  source?: 'user' | 'system';
}

function getPluginName(filePath: string): string {
  // Extract plugin name from path like:
  // ~/.claude/plugins/cache/<marketplace>/<plugin-name>/<version>/skills/...
  const parts = filePath.replace(/\\/g, '/').split('/');
  const cacheIdx = parts.indexOf('cache');
  if (cacheIdx !== -1 && parts[cacheIdx + 2]) {
    // parts[cacheIdx+1] = marketplace, parts[cacheIdx+2] = plugin name
    return parts[cacheIdx + 2];
  }
  // Fallback: look for "skills" and take 2 segments before it
  const skillsIdx = parts.indexOf('skills');
  if (skillsIdx >= 2) {
    return parts[skillsIdx - 2];
  }
  return 'Custom';
}

function CollapsibleSection({ icon, label, count, children }: { icon: string; label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        className="flex items-center gap-2 mb-3 w-full text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-medium" style={{ color: label === 'User' ? 'var(--accent-light)' : 'var(--text-muted)' }}>{label}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}>{count}</span>
        <svg className="w-4 h-4 ml-auto transition-transform" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

export default function SkillsPage() {
  const { data: skillsRaw, isLoading: loading, mutate } = useSkills();
  const skills = (skillsRaw ?? []) as Skill[];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Skill | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

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

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Split by source
  const userSkills = filtered.filter((s) => s.source === 'user');
  const systemSkills = filtered.filter((s) => s.source !== 'user');

  // Group system skills by plugin
  const systemGrouped = systemSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const plugin = getPluginName(skill.filePath);
    if (!acc[plugin]) acc[plugin] = [];
    acc[plugin].push(skill);
    return acc;
  }, {});

  function toggleSection(plugin: string) {
    setCollapsed((prev) => ({ ...prev, [plugin]: !prev[plugin] }));
  }

  function renderSkillRow(skill: Skill, i: number, total: number) {
    return (
      <div
        key={skill.name}
        className="flex items-start gap-4 px-5 py-3 cursor-pointer transition-colors hover:bg-bg-hover"
        style={{
          borderBottom: i < total - 1 ? '1px solid var(--border)' : 'none',
        }}
        onClick={() => setSelected(skill)}
      >
        <code
          className="text-sm font-mono shrink-0"
          style={{ color: 'var(--accent-light)' }}
        >
          {skill.name}
        </code>
        <div className="flex-1 min-w-0">
          {skill.description && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {skill.description}
            </p>
          )}
          {skill.tags && skill.tags.length > 0 && (
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {skill.tags.map((tag) => (
                <Tag key={tag} label={tag} variant="gray" />
              ))}
            </div>
          )}
        </div>
        <Tag label="skill" variant="purple" />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-bg-primary">
        <Header title="Skills" />

        <div className="mb-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Search skills..." />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No skills match your search.' : 'No skills found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Skills Section */}
          {userSkills.length > 0 && (
            <CollapsibleSection icon="👤" label="User" count={userSkills.length}>
              <div
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
              >
                {userSkills.map((skill, i) => renderSkillRow(skill, i, userSkills.length))}
              </div>
            </CollapsibleSection>
          )}

          {/* System Skills Section */}
          {systemSkills.length > 0 && (
            <CollapsibleSection icon="🔧" label="System" count={systemSkills.length}>
              <div className="space-y-4">
                {Object.entries(systemGrouped).map(([plugin, pluginSkills]) => {
                  const isCollapsed = collapsed[plugin];
                  return (
                    <div
                      key={plugin}
                      className="rounded-lg overflow-hidden"
                      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                    >
                      {/* Section header */}
                      <button
                        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-bg-hover"
                        style={{ borderBottom: isCollapsed ? 'none' : '1px solid var(--border)' }}
                        onClick={() => toggleSection(plugin)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {plugin}
                          </span>
                          <Tag label={`${pluginSkills.length}`} variant="purple" />
                        </div>
                        <svg
                          className="w-4 h-4 transition-transform"
                          style={{
                            color: 'var(--text-muted)',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Skills list */}
                      {!isCollapsed && (
                        <div>
                          {pluginSkills.map((skill, i) => renderSkillRow(skill, i, pluginSkills.length))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}
        </div>
      )}

      {/* Fullscreen Skill Viewer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <code className="text-base font-mono font-medium" style={{ color: 'var(--accent-light)' }}>
                {selected.name}
              </code>
              <Tag label={selected.source === 'user' ? 'User' : 'System'} variant={selected.source === 'user' ? 'purple' : 'gray'} />
              <Tag label={getPluginName(selected.filePath)} variant="blue" />
              {selected.description && (
                <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  — {selected.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <code className="text-xs font-mono hidden lg:block" style={{ color: 'var(--text-muted)' }}>
                {selected.filePath}
              </code>
              {selected.source === 'user' && !editing && (
                <button
                  onClick={() => { setEditing(true); setEditContent(selected.content ?? ''); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-bg-hover"
                  style={{ color: 'var(--accent-light)' }}
                >
                  Edit
                </button>
              )}
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-bg-hover"
                style={{ color: 'var(--text-secondary)' }}
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
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)', minHeight: '500px' }}
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
