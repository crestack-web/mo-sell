'use client';

import React, { useState, useEffect } from 'react';
import { THEMES, getThemeType, type ThemeMeta } from '@/themes/registry';

interface ThemeSwitcherProps {
  currentTheme: string;
  storeSlug: string;
}

export function ThemeSwitcher({ currentTheme, storeSlug }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const linkThemes = THEMES.filter(t => t.type === 'link-style');
  const ecommerceThemes = THEMES.filter(t => t.type === 'e-commerce');

  const handleThemeChange = (themeId: string) => {
    // Update URL with theme parameter
    const url = new URL(window.location.href);
    url.searchParams.set('theme', themeId);
    window.location.href = url.toString();
  };

  const ThemeButton = ({ theme }: { theme: ThemeMeta }) => {
    const isActive = currentTheme === theme.id;
    return (
      <button
        onClick={() => handleThemeChange(theme.id)}
        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
          isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ background: theme.previewAccent }}
          >
            {theme.name.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-gray-900">{theme.name}</p>
              {theme.badge && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ color: theme.badge.color, backgroundColor: theme.badge.bg }}
                >
                  {theme.badge.label}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{theme.description}</p>
            <p className="text-xs text-gray-400 mt-1">{theme.bestFor.join(', ')}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 max-h-[70vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Switch Theme</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-4">
            {/* Link Bio Themes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Link-in-Bio Themes
              </p>
              <div className="space-y-2">
                {linkThemes.map(theme => (
                  <ThemeButton key={theme.id} theme={theme} />
                ))}
              </div>
            </div>

            {/* Ecommerce Themes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                E-Commerce Themes
              </p>
              <div className="space-y-2">
                {ecommerceThemes.map(theme => (
                  <ThemeButton key={theme.id} theme={theme} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Themes are temporary previews. Save your preferred theme in Settings.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 hover:bg-gray-800 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 flex items-center gap-2"
        title="Switch Theme"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span className="font-semibold text-sm">Theme</span>
          </>
        )}
      </button>
    </div>
  );
}