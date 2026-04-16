import { Button } from './button';

type DialogVariant = 'danger' | 'primary';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: DialogVariant;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: ConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--overlay-bg)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg p-6 w-full max-w-md mx-4"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--card-border)',
          boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg mb-2" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
