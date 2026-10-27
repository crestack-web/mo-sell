'use client';

import React from 'react';

/**
 * Default MO Sell profile avatar — kite mark on the brand sky→violet gradient.
 * Used whenever the merchant has not uploaded a photo.
 */
export function MoKiteMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Diamond kite body */}
      <path
        d="M12 2.5L19.5 10.5L12 18.5L4.5 10.5L12 2.5Z"
        fill="url(#moKiteGrad)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Cross spars */}
      <path d="M12 2.5V18.5" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
      <path d="M4.5 10.5H19.5" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
      {/* Center spark */}
      <circle cx="12" cy="10.5" r="1.6" fill="white" fillOpacity="0.9" />
      {/* Tail */}
      <path
        d="M12 18.5C12 18.5 11.2 20.2 12 21.5C12.8 20.2 12 18.5 12 18.5Z"
        fill="rgba(255,255,255,0.75)"
      />
      <path
        d="M12 19.2L10.4 20.6M12 19.8L13.6 21.2"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="moKiteGrad" x1="4.5" y1="2.5" x2="19.5" y2="18.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#E0F2FE" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C7D2FE" stopOpacity="0.85" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type MoSellAvatarProps = {
  photoURL?: string | null;
  /** Accessible label, e.g. user name */
  label?: string;
  className?: string;
  /** Extra inline styles on the outer circle */
  style?: React.CSSProperties;
  /** Icon size inside the circle (default scales with common 28–32px avatars) */
  iconSize?: number;
};

/**
 * Profile avatar for the MO Sell dashboard.
 * - Custom photo when `photoURL` is set
 * - Otherwise the branded kite mark on the MO sky→violet gradient
 */
export function MoSellAvatar({
  photoURL,
  label = 'Profile',
  className,
  style,
  iconSize = 16,
}: MoSellAvatarProps) {
  if (photoURL) {
    return (
      <div
        className={className}
        role="img"
        aria-label={label}
        style={{
          background: `url(${photoURL}) center/cover`,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{
        background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
        ...style,
      }}
    >
      <MoKiteMark size={iconSize} />
    </div>
  );
}
