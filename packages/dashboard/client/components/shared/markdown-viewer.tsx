import { lazy, Suspense, useMemo } from 'react';
import remarkGfm from 'remark-gfm';

const ReactMarkdown = lazy(() => import('react-markdown'));

// Strip YAML frontmatter (--- ... ---) from the top of markdown
function stripFrontmatter(content: string): string {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

export function MarkdownViewer({ content, className }: { content: string; className?: string }) {
  const cleaned = useMemo(() => stripFrontmatter(content), [content]);
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Loading viewer...</p>}>
      <div className={className ?? 'skill-markdown'}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
      </div>
    </Suspense>
  );
}
