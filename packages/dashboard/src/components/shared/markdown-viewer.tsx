'use client';

import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';

const ReactMarkdown = dynamic(
  () => import('react-markdown'),
  {
    ssr: false,
    loading: () => <p style={{ color: 'var(--text-muted)' }}>Loading viewer...</p>,
  }
);

export function MarkdownViewer({ content, className }: { content: string; className?: string }) {
  return (
    <div className={className ?? 'skill-markdown'}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
