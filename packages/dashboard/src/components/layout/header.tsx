'use client';

import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-[#0f0f14] pb-4 flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: '#b2bec3' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0 ml-6">
          {children}
        </div>
      )}
    </div>
  );
}
