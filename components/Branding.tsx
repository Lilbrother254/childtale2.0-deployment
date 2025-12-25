
import React from 'react';

// --- Logo Component ---
export const ChildTaleLogo = ({ className, size = 'lg', dark = true }: { className?: string, size?: 'sm' | 'lg', dark?: boolean }) => (
  <div className={`flex items-center select-none ${className}`}>
    <img
      src="/childtale-logo.png"
      alt="ChildTale"
      className={`${size === 'lg' ? 'h-28' : 'h-20'} w-auto transition-all duration-300`}
      style={!dark ? { filter: 'brightness(0) invert(1)' } : {}}
    />
  </div>
);


// --- Art Supplies SVGs ---
export const ArtCrayon = ({ color, className, rotation = "0" }: { color: string, className?: string, rotation?: string }) => (
  <svg viewBox="0 0 100 400" className={className} style={{ transform: `rotate(${rotation}deg)`, filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.15))' }}>
    <path d="M20 80 L50 20 L80 80 Z" fill={color} />
    <rect x="20" y="80" width="60" height="300" fill={color} />
    <rect x="20" y="120" width="60" height="220" fill="white" opacity="0.25" />
    <path d="M20 140 Q50 120 80 140" fill="none" stroke={color} strokeWidth="3" />
    <path d="M20 320 Q50 340 80 320" fill="none" stroke={color} strokeWidth="3" />
    <path d="M35 180 L65 180" stroke={color} strokeWidth="2" opacity="0.5" />
    <path d="M35 190 L65 190" stroke={color} strokeWidth="2" opacity="0.5" />
  </svg>
);

export const ArtPencil = ({ className, rotation = "0" }: { className?: string, rotation?: string }) => (
  <svg viewBox="0 0 60 500" className={className} style={{ transform: `rotate(${rotation}deg)`, filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.15))' }}>
    <rect x="10" y="0" width="40" height="50" rx="5" fill="#f87171" />
    <rect x="10" y="50" width="40" height="30" fill="#94a3b8" />
    <rect x="10" y="80" width="40" height="350" fill="#fbbf24" />
    <rect x="25" y="80" width="10" height="350" fill="#f59e0b" />
    <path d="M10 430 L30 500 L50 430 Z" fill="#fde68a" />
    <path d="M23 475 L30 500 L37 475 Z" fill="#1f2937" />
  </svg>
);
