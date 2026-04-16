
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/header';
import { Tag } from '@/components/shared/tag';
import { SearchBox } from '@/components/shared/search-box';
import { useRecommendations } from '@/lib/use-data';
import {
  generateRecommendations,
  searchSkills,
  searchMcpRegistry,
  type Recommendation,
  type SkillStoreResult,
} from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, string> = {
  plugin: '\u{1F9E9}',
  mcp: '\u{1F50C}',
  skill: '\u26A1',
};

const POPULARITY_VARIANT: Record<string, 'green' | 'blue' | 'purple' | 'orange'> = {
  Trending: 'green',
  Popular: 'blue',
  New: 'purple',
  Rising: 'orange',
};

const TYPE_FILTERS = ['All', 'Plugins', 'MCP Servers', 'Skills'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

const CATEGORY_ORDER = [
  'development',
  'productivity',
  'database',
  'ai',
  'devops',
  'testing',
  'documentation',
];

// ---------------------------------------------------------------------------
// Types for combined discovery results
// ---------------------------------------------------------------------------

interface DiscoveryResult {
  name: string;
  description?: string;
  source: 'skills.sh' | 'mcp-registry' | 'npm' | 'smithery';
  installCommand?: string;
  url?: string;
  badge?: string;
}

// ---------------------------------------------------------------------------
// FilterChip
// ---------------------------------------------------------------------------

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        backgroundColor: active ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: active ? '#fff' : 'var(--text-muted)',
        border: active ? 'none' : '1px solid var(--border)',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// RecommendationCard
// ---------------------------------------------------------------------------

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [copied, setCopied] = useState(false);

  const handleInstall = useCallback(() => {
    if (rec.installCommand) {
      navigator.clipboard.writeText(rec.installCommand).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [rec.installCommand]);

  const icon = TYPE_ICONS[rec.type] ?? '\u{1F4E6}';
  const popularityVariant = POPULARITY_VARIANT[rec.popularity] ?? 'gray';

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Top row: icon + name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{icon}</span>
          <span
            className="font-mono text-sm font-medium truncate"
            style={{ color: 'var(--accent-light)' }}
          >
            {rec.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tag label={rec.popularity} variant={popularityVariant} />
          {rec.category && (
            <Tag label={rec.category} variant="gray" />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {rec.description}
      </p>

      {/* Reason */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
      >
        {rec.reason}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        {rec.installCommand && (
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: copied ? 'var(--status-green)' : 'var(--accent)',
              color: '#fff',
            }}
            onClick={handleInstall}
          >
            {copied ? 'Copied!' : 'Copy Install'}
          </button>
        )}
        {rec.url && (
          <a
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              textDecoration: 'none',
            }}
          >
            View
          </a>
        )}
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
          }}
        >
          {rec.type}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiscoveryResultCard — used in "Find More" section
// ---------------------------------------------------------------------------

function DiscoveryResultCard({ result }: { result: DiscoveryResult }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (result.installCommand) {
      navigator.clipboard.writeText(result.installCommand).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [result.installCommand]);

  const sourceVariant: Record<string, 'green' | 'blue' | 'orange' | 'purple'> = {
    'skills.sh': 'purple',
    'mcp-registry': 'green',
    npm: 'blue',
    smithery: 'orange',
  };

  return (
    <div
      className="rounded-lg p-4 transition-colors hover:bg-bg-hover"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <code className="text-sm font-mono font-medium" style={{ color: 'var(--accent-light)' }}>
              {result.name}
            </code>
            <Tag label={result.source} variant={sourceVariant[result.source] ?? 'gray'} />
            {result.badge && <Tag label={result.badge} variant="blue" />}
          </div>
          {result.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {result.description}
            </p>
          )}
          {result.installCommand && (
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
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          )}
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline mt-1 inline-block transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discovery search skeleton
// ---------------------------------------------------------------------------

function DiscoverySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg p-4 animate-pulse"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="h-4 rounded w-48 mb-2" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-3 rounded w-full mb-1" style={{ backgroundColor: 'var(--border)' }} />
              <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--border)' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Find More section
// ---------------------------------------------------------------------------

function FindMoreSection() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Search both skills.sh and MCP registries in parallel
      const [skillsResult, mcpResult] = await Promise.allSettled([
        searchSkills(query),
        searchMcpRegistry(query),
      ]);

      const combined: DiscoveryResult[] = [];

      // Add skills.sh results
      if (skillsResult.status === 'fulfilled') {
        for (const s of skillsResult.value as SkillStoreResult[]) {
          combined.push({
            name: s.name,
            source: 'skills.sh',
            installCommand: s.installCommand,
            url: s.url,
            badge: s.installs,
          });
        }
      }

      // Add MCP registry results
      if (mcpResult.status === 'fulfilled') {
        for (const r of mcpResult.value.results) {
          combined.push({
            name: r.name,
            description: r.description,
            source: r.source,
            installCommand: r.installCommand,
            url: r.repositoryUrl ?? r.npmUrl,
          });
        }
      }

      setResults(combined);
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

  return (
    <div className="mt-10">
      <h2 className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        Find More
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Search skills.sh and MCP registries to discover more tools.
      </p>

      <div className="mb-4">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search skills and MCP servers..."
        />
      </div>

      {loading ? (
        <DiscoverySkeleton />
      ) : searched && results.length === 0 ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No results found for &ldquo;{search}&rdquo;.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} from skills.sh and MCP registries
          </p>
          {results.map((r) => (
            <DiscoveryResultCard key={`${r.source}-${r.name}`} result={r} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function RecommendedPage() {
  const { data, isLoading, mutate } = useRecommendations();
  const [generating, setGenerating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const recommendations = (data?.recommendations ?? []) as Recommendation[];
  const generatedAt = data?.generatedAt ?? null;
  const model = data?.model ?? null;

  // Derive available categories from data
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const rec of recommendations) {
      if (rec.category) cats.add(rec.category);
    }
    return CATEGORY_ORDER.filter((c) => cats.has(c)).concat(
      [...cats].filter((c) => !CATEGORY_ORDER.includes(c)),
    );
  }, [recommendations]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = recommendations;

    if (typeFilter === 'Plugins') list = list.filter((r) => r.type === 'plugin');
    else if (typeFilter === 'MCP Servers') list = list.filter((r) => r.type === 'mcp');
    else if (typeFilter === 'Skills') list = list.filter((r) => r.type === 'skill');

    if (categoryFilter) list = list.filter((r) => r.category === categoryFilter);

    return list;
  }, [recommendations, typeFilter, categoryFilter]);

  // Generate / refresh
  const handleRefresh = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await generateRecommendations();
      await mutate(result, false);
    } catch {
      // fall through — will show whatever was cached
    } finally {
      setGenerating(false);
    }
  }, [mutate]);

  const isEmpty = recommendations.length === 0 && !isLoading && !generating;

  return (
    <div>
      <Header
        title="Recommended"
        subtitle="AI-powered recommendations based on your setup"
      >
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          style={{
            backgroundColor: generating ? 'var(--bg-tertiary)' : 'var(--accent)',
            color: generating ? 'var(--text-muted)' : '#fff',
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
          disabled={generating}
          onClick={handleRefresh}
        >
          {generating && (
            <span
              className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
              style={{
                borderColor: 'var(--card-border)',
                borderTopColor: 'var(--accent-light)',
              }}
            />
          )}
          {generating ? 'Generating...' : 'Refresh'}
        </button>
      </Header>

      {/* Metadata line */}
      {generatedAt && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Generated {new Date(generatedAt).toLocaleString()}
          {model && model !== 'static' && model !== 'static-fallback'
            ? ` via ${model}`
            : model === 'static' || model === 'static-fallback'
              ? ' (static fallback)'
              : ''}
        </p>
      )}

      {/* Filter chips */}
      {recommendations.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {TYPE_FILTERS.map((tf) => (
            <FilterChip
              key={tf}
              label={tf}
              active={typeFilter === tf}
              onClick={() => {
                setTypeFilter(tf);
                setCategoryFilter(null);
              }}
            />
          ))}
          <span
            className="w-px h-5 mx-1"
            style={{ backgroundColor: 'var(--border)' }}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={categoryFilter === cat}
              onClick={() =>
                setCategoryFilter(categoryFilter === cat ? null : cat)
              }
            />
          ))}
        </div>
      )}

      {/* Loading state */}
      {(isLoading || generating) && recommendations.length === 0 && (
        <div
          className="rounded-lg p-12 text-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <span
            className="inline-block w-8 h-8 rounded-full border-3 animate-spin mb-4"
            style={{
              borderWidth: '3px',
              borderColor: 'var(--card-border)',
              borderTopColor: 'var(--accent-light)',
            }}
          />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {generating
              ? 'Generating personalized recommendations...'
              : 'Loading recommendations...'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            This may take a few seconds
          </p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div
          className="rounded-lg p-12 text-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>
            No recommendations yet
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-faint)' }}>
            Click Refresh to generate personalized recommendations based on your
            installed plugins, MCP servers, and skills.
          </p>
          <button
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            onClick={handleRefresh}
          >
            Generate Recommendations
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {filtered.map((rec) => (
            <RecommendationCard key={`${rec.type}-${rec.name}`} rec={rec} />
          ))}
        </div>
      )}

      {/* No matches after filtering */}
      {recommendations.length > 0 && filtered.length === 0 && !isLoading && (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No recommendations match the current filter.
          </p>
        </div>
      )}

      {/* Find More section */}
      <FindMoreSection />
    </div>
  );
}
