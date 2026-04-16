
import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { SearchBox } from '@/components/shared/search-box';
import { Tag } from '@/components/shared/tag';
import { MarkdownViewer } from '@/components/shared/markdown-viewer';
import { useSkills } from '@/lib/use-data';
import { fetchSkillContent, updateSkillContent, searchSkills, fetchTopSkills, type SkillStoreResult } from '@/lib/api-client';

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

// ---------------------------------------------------------------------------
// Loading skeleton for skill store search results
// ---------------------------------------------------------------------------

function SkillSearchSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg p-5 animate-pulse"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-4 rounded w-64 mb-2" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-3 rounded w-24 mb-3" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-3 rounded w-full" style={{ backgroundColor: 'var(--border)' }} />
            </div>
            <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: 'var(--border)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill Store result card
// ---------------------------------------------------------------------------

function SkillStoreCard({ result }: { result: SkillStoreResult }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.installCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result.installCommand]);

  return (
    <div
      className="rounded-lg p-5 transition-colors hover:bg-bg-hover"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <code className="text-sm font-mono font-medium" style={{ color: 'var(--accent-light)' }}>
              {result.name}
            </code>
            <Tag label={result.installs} variant="blue" />
          </div>

          {/* Install command */}
          <div className="flex items-center gap-2 mt-2">
            <code
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              {result.installCommand}
            </code>
            <button
              className="p-1 rounded transition-colors hover:bg-bg-hover shrink-0"
              style={{ color: copied ? 'var(--status-green)' : 'var(--text-muted)' }}
              onClick={handleCopy}
              title="Copy install command"
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          {/* View link */}
          <div className="mt-2">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              View on skills.sh
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill Store tab content
// ---------------------------------------------------------------------------

function SkillStoreTab() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SkillStoreResult[]>([]);
  const [topResults, setTopResults] = useState<SkillStoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [topLoading, setTopLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topFetchedRef = useRef(false);

  // Fetch top 20 skills on mount
  useEffect(() => {
    if (topFetchedRef.current) return;
    topFetchedRef.current = true;
    setTopLoading(true);
    fetchTopSkills()
      .then((data) => setTopResults(data))
      .catch(() => {})
      .finally(() => setTopLoading(false));
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchSkills(query);
      setResults(data);
      setSearched(true);
    } catch {
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(search), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doSearch]);

  // Show search results when user has typed, otherwise show top 20
  const showingSearch = search.trim().length > 0;
  const displayResults = showingSearch ? results : topResults;
  const isLoading = showingSearch ? loading : topLoading;

  return (
    <div>
      {/* Search box */}
      <div className="mb-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search skills on skills.sh..."
        />
      </div>

      {/* Results area */}
      {isLoading ? (
        <SkillSearchSkeleton />
      ) : showingSearch && searched && results.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No results found for &ldquo;{search}&rdquo;.
          </p>
        </div>
      ) : displayResults.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {showingSearch
              ? `${displayResults.length} result${displayResults.length !== 1 ? 's' : ''}`
              : `Top ${displayResults.length} Skills`}
          </p>
          {displayResults.map((r) => (
            <SkillStoreCard key={r.name} result={r} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-lg p-10 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            Search the skills.sh ecosystem — 91,000+ skills available
          </p>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Type a search term above to discover skills for Claude.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SkillsPage() {
  const { data: skillsRaw, isLoading: loading, mutate } = useSkills();
  const skills = (skillsRaw ?? []) as Skill[];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Skill | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [tab, setTab] = useState<'installed' | 'store'>('installed');

  async function handleSelectSkill(skill: Skill) {
    setSelected(skill);
    setSelectedContent(null);
    setContentLoading(true);
    try {
      const { content } = await fetchSkillContent(skill.filePath);
      setSelectedContent(content);
    } catch {
      setSelectedContent('*Failed to load content*');
    } finally {
      setContentLoading(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await updateSkillContent(selected.filePath, editContent);
      setSelectedContent(editContent);
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
        onClick={() => handleSelectSkill(skill)}
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

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'installed' ? 'var(--accent)' : 'transparent',
              color: tab === 'installed' ? '#fff' : 'var(--text-muted)',
            }}
            onClick={() => setTab('installed')}
          >
            Installed
          </button>
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'store' ? 'var(--accent)' : 'transparent',
              color: tab === 'store' ? '#fff' : 'var(--text-muted)',
            }}
            onClick={() => setTab('store')}
          >
            Skill Store
          </button>
        </div>
      </div>

      {tab === 'installed' ? (
        /* ---- Installed tab ---- */
        <>
          <div className="mb-4">
            <SearchBox value={search} onChange={setSearch} placeholder="Search skills..." />
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <div
              className="rounded-lg p-10 text-center"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {search ? 'No skills match your search.' : (
                  <>
                    No skills found. Browse the{' '}
                    <button className="underline" style={{ color: 'var(--accent-light)' }} onClick={() => setTab('store')}>
                      Skill Store
                    </button>{' '}
                    to discover and install skills.
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Skills Section */}
              {userSkills.length > 0 && (
                <CollapsibleSection icon="&#x1F464;" label="User" count={userSkills.length}>
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
                <CollapsibleSection icon="&#x1F527;" label="System" count={systemSkills.length}>
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
                  {selected.source === 'user' && !editing && !contentLoading && (
                    <button
                      onClick={() => { setEditing(true); setEditContent(selectedContent ?? ''); }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-bg-hover"
                      style={{ color: 'var(--accent-light)' }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-bg-hover"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => { setSelected(null); setEditing(false); setSelectedContent(null); }}
                  >
                    &#x2715;
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
                ) : contentLoading ? (
                  <div className="max-w-4xl mx-auto text-center py-12">
                    <p style={{ color: 'var(--text-muted)' }}>Loading content...</p>
                  </div>
                ) : (
                  <MarkdownViewer
                    content={selectedContent ?? '*No content available*'}
                    className="max-w-4xl mx-auto skill-markdown"
                  />
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ---- Skill Store tab ---- */
        <SkillStoreTab />
      )}
    </div>
  );
}
