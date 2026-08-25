'use client';

import React from 'react';

/**
 * Purple Instagram-style verified checkmark shown next to a creator's name
 * on the link-in-bio page.
 */
export function VerifiedBadge({ size = 18, title = 'Verified' }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#A855F7" />
      <path
        d="M7 12.2l3.2 3.2 6.8-6.8"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Renders a creator name with an optional purple verified badge. */
export function VerifiedName({
  name,
  verified,
  style,
  as: Tag = 'span' as const,
}: {
  name: string;
  verified?: boolean;
  style?: React.CSSProperties;
  as?: 'span' | 'h1' | 'p' | 'div';
}) {
  const fontSize = style?.fontSize;
  let badgeSize = 18;
  if (typeof fontSize === 'number') {
    badgeSize = Math.max(14, Math.round(fontSize * 0.85));
  } else if (typeof fontSize === 'string') {
    const n = parseFloat(fontSize);
    if (!Number.isNaN(n)) {
      const px = fontSize.includes('rem') ? n * 16 : n;
      badgeSize = Math.max(14, Math.round(px * 0.85));
    }
  }

  return (
    <Tag
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        margin: 0,
        ...style,
      }}
    >
      <span>{name}</span>
      {verified ? <VerifiedBadge size={badgeSize} /> : null}
    </Tag>
  );
}
