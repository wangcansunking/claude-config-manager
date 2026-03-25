'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<ButtonVariant, { bg: string; color: string; hoverBg: string }> = {
  primary:   { bg: '#6c5ce7', color: '#ffffff', hoverBg: '#5a4dd6' },
  secondary: { bg: '#2a2a35', color: '#b2bec3', hoverBg: '#353540' },
  danger:    { bg: '#ff4757', color: '#ffffff', hoverBg: '#e03547' },
  ghost:     { bg: 'transparent', color: '#b2bec3', hoverBg: '#2a2a35' },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const styles = variantStyles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ backgroundColor: styles.bg, color: styles.color }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = styles.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = styles.bg;
        }
      }}
    >
      {children}
    </button>
  );
}
