/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BrandLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'inline' | 'stacked';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  iconOnly = false,
  size = 'md',
  layout
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-sm' },
    md: { icon: 'w-10 h-10', text: 'text-[17px]' },
    lg: { icon: 'w-16 h-16', text: 'text-2xl' },
    xl: { icon: 'w-24 h-24', text: 'text-4xl' }
  };

  const currentSize = sizeMap[size];
  const activeLayout = layout || (size === 'xl' || size === 'lg' ? 'stacked' : 'inline');

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-quality Overlapping Vector "P" Logo */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`${currentSize.icon} shrink-0`}
      >
        <defs>
          {/* Main Royal Blue to Sky Blue Gradient */}
          <linearGradient id="p-tube-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          {/* Glowing Filter */}
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow effect layer */}
        <path 
          d="M 22,38 L 22,78 C 22,88 34,88 34,78 L 34,66 C 34,58 42,52 50,52 L 56,52 C 70,52 80,42 80,28 C 80,14 70,8 56,8 L 36,8 C 28,8 22,14 22,22 L 22,38"
          stroke="#2563eb"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.4"
          filter="url(#logo-glow)"
        />

        {/* Main Neon-style Rounded Tube Path */}
        <path 
          d="M 22,38 L 22,78 C 22,88 34,88 34,78 L 34,66 C 34,58 42,52 50,52 L 56,52 C 70,52 80,42 80,28 C 80,14 70,8 56,8 L 36,8 C 28,8 22,14 22,22 L 22,38"
          stroke="url(#p-tube-grad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Inner shine highlight for 3D glassy tube effect */}
        <path 
          d="M 26,38 L 26,72"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.35"
          fill="none"
        />
        <path 
          d="M 38,13 C 44,12 50,12 56,13 C 65,14 72,20 74,28"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.3"
          fill="none"
        />
      </svg>

      {/* Brand Text */}
      {!iconOnly && (
        activeLayout === 'stacked' ? (
          <div className="flex flex-col text-left leading-[0.95] tracking-tight">
            <span className={`${size === 'xl' ? 'text-4xl' : 'text-2xl'} font-sans font-extrabold text-slate-950 dark:text-white`}>
              Paper
            </span>
            <span className={`${size === 'xl' ? 'text-4xl' : 'text-2xl'} font-sans font-extrabold text-slate-950 dark:text-white mt-0.5`}>
              Market
            </span>
            <span className={`${size === 'xl' ? 'text-4xl' : 'text-2xl'} font-sans font-extrabold text-blue-600 dark:text-sky-400 mt-1`}>
              Pro
            </span>
          </div>
        ) : (
          <div className="flex flex-col leading-none">
            <span className={`font-display font-bold tracking-tight ${currentSize.text} text-slate-950 dark:text-white flex items-center`}>
              <span>Paper Market</span>
              <span className="text-blue-600 dark:text-sky-400 font-extrabold ml-1.5">Pro</span>
            </span>
            <span className="text-[9px] text-slate-500 dark:text-gray-400 font-semibold font-sans mt-0.5 tracking-wide">
              AI Sim Trading & Analytics
            </span>
          </div>
        )
      )}
    </div>
  );
};
