import React from 'react';
import { Tag } from '../shared/tag';

type TagVariant = 'green' | 'blue' | 'orange' | 'purple' | 'red' | 'yellow' | 'pink' | 'gray';

interface TagItem {
  label: string;
  variant?: TagVariant;
}

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tags?: TagItem[];
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DetailPanel({
  open,
  onClose,
  title,
  subtitle,
  icon,
  tags,
  children,
  actions,
}: DetailPanelProps) {
  return (
    <>
      {/* Dimmed overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'var(--overlay-bg)' }}
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full flex flex-col"
        style={{
          width: '440px',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--card-border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease-in-out',
          boxShadow: open ? '-8px 0 32px rgba(0, 0, 0, 0.4)' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 mt-0.5 text-xl">{icon}</div>
            )}
            <div className="min-w-0">
              <h2 className="truncate" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {subtitle}
                </p>
              )}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag, i) => (
                    <Tag key={i} label={tag.label} variant={tag.variant} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-3 p-1 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close panel"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer actions */}
        {actions && (
          <div
            className="shrink-0 flex items-center justify-end gap-3 p-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
