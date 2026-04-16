import { lazy, Suspense } from 'react';
import remarkGfm from 'remark-gfm';

const ReactMarkdown = lazy(() => import('react-markdown'));

export function MarkdownViewer({ content, className }: { content: string; className?: string }) {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Loading viewer...</p>}>
      <div className={className ?? 'skill-markdown'}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </Suspense>
  );
}
