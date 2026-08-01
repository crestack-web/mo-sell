'use client';

import React from 'react';

interface ThemeSwitcherProps {
  storeSlug: string;
  isDefaultLinkTheme: boolean;
  isOverrideActive: boolean;
}

export function ThemeSwitcher({ storeSlug, isDefaultLinkTheme, isOverrideActive }: ThemeSwitcherProps) {
  // If the store is NOT configured as a link theme by default, we don't need a switcher
  if (!isDefaultLinkTheme) return null;

  const switchToEcommerce = () => {
    // Set cookie to Luxe (a great default ecommerce theme)
    document.cookie = `sf_theme_override_${storeSlug}=luxe; path=/; max-age=31536000`;
    window.location.reload();
  };

  const switchToDefault = () => {
    // Clear cookie
    document.cookie = `sf_theme_override_${storeSlug}=; path=/; max-age=0`;
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 99999,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {isOverrideActive ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '30px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          fontWeight: 500,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <span>Viewing E-commerce Mode</span>
          <button
            onClick={switchToDefault}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = '#f1f5f9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            Back to Link-in-Bio
          </button>
        </div>
      ) : (
        <button
          onClick={switchToEcommerce}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '30px',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.4)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 28px -5px rgba(79, 70, 229, 0.5), 0 10px 12px -6px rgba(79, 70, 229, 0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.4)';
          }}
        >
          <span>✨ View E-commerce Version</span>
        </button>
      )}
    </div>
  );
}
