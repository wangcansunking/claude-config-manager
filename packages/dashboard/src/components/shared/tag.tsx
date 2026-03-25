'use client';

type TagVariant = 'green' | 'blue' | 'orange' | 'purple' | 'red' | 'yellow' | 'pink' | 'gray';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

const variantStyles: Record<TagVariant, { bg: string; color: string }> = {
  green:  { bg: 'rgba(0, 184, 148, 0.15)',   color: '#00b894' },
  blue:   { bg: 'rgba(9, 132, 227, 0.15)',    color: '#0984e3' },
  orange: { bg: 'rgba(225, 112, 85, 0.15)',   color: '#e17055' },
  purple: { bg: 'rgba(108, 92, 231, 0.15)',   color: '#a29bfe' },
  red:    { bg: 'rgba(255, 71, 87, 0.15)',    color: '#ff4757' },
  yellow: { bg: 'rgba(253, 203, 110, 0.15)',  color: '#fdcb6e' },
  pink:   { bg: 'rgba(253, 121, 168, 0.15)',  color: '#fd79a8' },
  gray:   { bg: 'rgba(99, 110, 114, 0.2)',    color: '#b2bec3' },
};

export function Tag({ label, variant = 'gray' }: TagProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: styles.bg, color: styles.color }}
    >
      {label}
    </span>
  );
}
