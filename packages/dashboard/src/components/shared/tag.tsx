'use client';

type TagVariant = 'green' | 'blue' | 'orange' | 'purple' | 'red' | 'yellow' | 'pink' | 'gray';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

const variantStyles: Record<TagVariant, { bg: string; color: string }> = {
  green:  { bg: 'rgba(39, 166, 68, 0.15)',    color: '#27a644' },
  blue:   { bg: 'rgba(94, 106, 210, 0.15)',   color: '#7170ff' },
  orange: { bg: 'rgba(138, 143, 152, 0.15)',  color: '#d0d6e0' },
  purple: { bg: 'rgba(94, 106, 210, 0.15)',   color: '#7170ff' },
  red:    { bg: 'rgba(255, 71, 87, 0.15)',    color: '#ff4757' },
  yellow: { bg: 'rgba(138, 143, 152, 0.15)',  color: '#d0d6e0' },
  pink:   { bg: 'rgba(94, 106, 210, 0.12)',   color: '#828fff' },
  gray:   { bg: 'rgba(255, 255, 255, 0.05)',  color: '#8a8f98' },
};

export function Tag({ label, variant = 'gray' }: TagProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs"
      style={{ backgroundColor: styles.bg, color: styles.color, fontWeight: 510 }}
    >
      {label}
    </span>
  );
}
