'use client';

import React from 'react';

interface MotionFrameProps {
  src: string;
  title: string;
  /** CSS aspect-ratio value matching the source animation's stage. */
  ratio?: string;
  loading?: 'eager' | 'lazy';
  style?: React.CSSProperties;
}

export function MotionFrame({
  src,
  title,
  ratio = '900 / 640',
  loading = 'lazy',
  style,
}: MotionFrameProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        overflow: 'hidden',
        background: 'transparent',
        ...style,
      }}
    >
      <iframe
        src={src}
        title={title}
        loading={loading}
        scrolling="no"
        sandbox="allow-scripts"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
        }}
      />
    </div>
  );
}
