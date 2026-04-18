import { useState } from 'react';
import { Button } from './button';

interface InfoDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  command?: string;
  commandNote?: string;
}

export function InfoDialog({ open, onClose, title, message, command, commandNote }: InfoDialogProps) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  function handleCopy() {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--overlay-bg)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg p-6 w-full max-w-lg mx-4"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--card-border)',
          boxShadow: 'rgba(0,0,0,0.4) 0px 8px 24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg mb-3" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
          {title}
        </h3>
        <p className="text-sm mb-4 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>

        {command && (
          <div
            className="rounded-lg p-3 mb-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <code
              className="text-sm font-mono flex-1 min-w-0 break-all"
              style={{ color: 'var(--accent-light)' }}
            >
              {command}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:bg-bg-hover"
              style={{
                color: copied ? 'var(--status-green)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        )}

        {commandNote && (
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            {commandNote}
          </p>
        )}

        <div className="flex items-center justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
