'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { DetailPanel } from '@/components/layout/detail-panel';
import { SearchBox } from '@/components/shared/search-box';
import { Tag } from '@/components/shared/tag';
import { useSkills } from '@/lib/use-data';

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

export default function SkillsPage() {
  const { data: skillsRaw, isLoading: loading } = useSkills();
  const skills = (skillsRaw ?? []) as Skill[];
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Skill | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
        className="flex items-start gap-4 px-5 py-3 cursor-pointer transition-colors hover:bg-[#252530]"
        style={{
          borderBottom: i < total - 1 ? '1px solid #2a2a35' : 'none',
        }}
        onClick={() => setSelected(skill)}
      >
        <code
          className="text-sm font-mono shrink-0"
          style={{ color: '#a29bfe' }}
        >
          {skill.name}
        </code>
        <div className="flex-1 min-w-0">
          {skill.description && (
            <p className="text-xs" style={{ color: '#b2bec3' }}>
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
      <div className="sticky top-0 z-10 bg-[#0f0f14]">
        <Header title="Skills" />

        <div className="mb-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Search skills..." />
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#b2bec3' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
        >
          <p className="text-sm" style={{ color: '#636e72' }}>
            {search ? 'No skills match your search.' : 'No skills found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Skills Section */}
          {userSkills.length > 0 && (
            <div className="mb-8">
              <SectionHeading icon={'\ud83d\udc64'} label="User" count={userSkills.length} />
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
              >
                {userSkills.map((skill, i) => renderSkillRow(skill, i, userSkills.length))}
              </div>
            </div>
          )}

          {/* System Skills Section */}
          {systemSkills.length > 0 && (
            <div>
              <SectionHeading icon={'\ud83d\udd27'} label="System" count={systemSkills.length} />
              <div className="space-y-4">
                {Object.entries(systemGrouped).map(([plugin, pluginSkills]) => {
                  const isCollapsed = collapsed[plugin];
                  return (
                    <div
                      key={plugin}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: '#1e1e28', border: '1px solid #2a2a35' }}
                    >
                      {/* Section header */}
                      <button
                        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors hover:bg-[#252530]"
                        style={{ borderBottom: isCollapsed ? 'none' : '1px solid #2a2a35' }}
                        onClick={() => toggleSection(plugin)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                            {plugin}
                          </span>
                          <Tag label={`${pluginSkills.length}`} variant="purple" />
                        </div>
                        <svg
                          className="w-4 h-4 transition-transform"
                          style={{
                            color: '#636e72',
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
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? getPluginName(selected.filePath) : undefined}
        tags={selected?.tags?.map((t) => ({ label: t, variant: 'gray' as const })) ?? []}
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

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                Source
              </h3>
              <code className="text-xs font-mono break-all" style={{ color: '#636e72' }}>
                {selected.filePath}
              </code>
            </section>

            {selected.content && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                  Content Preview
                </h3>
                <pre
                  className="text-xs rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap"
                  style={{ backgroundColor: '#16161d', color: '#b2bec3' }}
                >
                  {selected.content.slice(0, 500)}
                  {selected.content.length > 500 ? '...' : ''}
                </pre>
              </section>
            )}

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#636e72' }}>
                Source Plugin
              </h3>
              <Tag label={getPluginName(selected.filePath)} variant="blue" />
            </section>
          </div>
        )}
      </DetailPanel>
    </div>
  );
}
