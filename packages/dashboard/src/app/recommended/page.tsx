'use client';

import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Tag } from '@/components/shared/tag';
import { useRecommendations } from '@/lib/use-data';
import { generateRecommendations, type Recommendation } from '@/lib/api-client';

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
    </div>
  );
}
