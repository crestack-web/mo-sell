import type { CSSProperties } from 'react';
import type { StorefrontTheme } from '@/types/mo-sell.types';

// ─── CSS variable injection per theme ─────────────────────────────────────────
// These mirror storefront.css [data-theme="..."] exactly.
// Pure helper (no 'use client') so it can be called from both server
// components (e.g. link-in-bio product pages) and client components.

export function getThemeCssVars(theme: StorefrontTheme, primary: string, secondary: string): CSSProperties {
  const base = { '--sf-primary': primary, '--sf-secondary': secondary };
  const themeVars = (() => {
    switch (theme) {
      case 'luxe': return {
        '--sf-bg': '#0A0A0A', '--sf-surface': '#111111', '--sf-border': '#222222',
        '--sf-text-1': '#F5F0E8', '--sf-text-2': '#A89878', '--sf-text-3': '#5A5040',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-gold': '#C9A84C', '--sf-nav-h': '64px',
        '--sf-font': '"Playfair Display",Georgia,serif',
      };
      case 'ankara': return {
        '--sf-bg': '#FFC93C', '--sf-surface': '#FFFFFF', '--sf-border': '#1A1A1A',
        '--sf-text-1': '#1A1A1A', '--sf-text-2': '#4A4A4A', '--sf-text-3': '#6B6B6B',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FF3E7F', '--sf-accent-2': '#00A896', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
      case 'atelier': return {
        '--sf-bg': '#0B0B0B', '--sf-surface': '#161616', '--sf-border': '#2A2A2A',
        '--sf-text-1': '#F5F5F0', '--sf-text-2': '#9C9C94', '--sf-text-3': '#5A5A54',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#D4AF6A', '--sf-accent-2': '#FFFFFF', '--sf-nav-h': '64px',
        '--sf-font': "Georgia,serif",
      };
      case 'citrus': return {
        '--sf-bg': '#FFF4DE', '--sf-surface': '#FFFFFF', '--sf-border': '#FFDDA8',
        '--sf-text-1': '#1F2A1A', '--sf-text-2': '#5C6B52', '--sf-text-3': '#9AAB8C',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FF7A1A', '--sf-accent-2': '#8BC53F', '--sf-nav-h': '64px',
        '--sf-font': 'Verdana,system-ui,sans-serif',
      };
      case 'nordly': return {
        '--sf-bg': '#F7F5F0', '--sf-surface': '#FFFFFF', '--sf-border': '#E4DFD3',
        '--sf-text-1': '#22201C', '--sf-text-2': '#8A8479', '--sf-text-3': '#B7ADA0',
        '--sf-radius': '4px', '--sf-radius-sm': '4px', '--sf-radius-lg': '8px',
        '--sf-accent': '#5B6B58', '--sf-accent-2': '#B7ADA0', '--sf-nav-h': '64px',
        '--sf-font': "'Century Gothic',system-ui,sans-serif",
      };
      case 'neotech': return {
        '--sf-bg': '#0A0E17', '--sf-surface': '#121826', '--sf-border': '#233047',
        '--sf-text-1': '#E8ECFF', '--sf-text-2': '#7C879E', '--sf-text-3': '#4A5468',
        '--sf-radius': '8px', '--sf-radius-sm': '6px', '--sf-radius-lg': '12px',
        '--sf-accent': '#3D8BFF', '--sf-accent-2': '#00FFC2', '--sf-nav-h': '64px',
        '--sf-font': "'Courier New',monospace",
      };
      case 'terra': return {
        '--sf-bg': '#F1EEE4', '--sf-surface': '#FFFFFF', '--sf-border': '#E2DCC8',
        '--sf-text-1': '#3A3327', '--sf-text-2': '#8A8065', '--sf-text-3': '#B0A78C',
        '--sf-radius': '12px', '--sf-radius-sm': '10px', '--sf-radius-lg': '18px',
        '--sf-accent': '#6B7A4F', '--sf-accent-2': '#B5652E', '--sf-nav-h': '64px',
        '--sf-font': "'Trebuchet MS',system-ui,sans-serif",
      };
      case 'volt': return {
        '--sf-bg': '#000000', '--sf-surface': '#111111', '--sf-border': '#2A2A2A',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': '#9A9A9A', '--sf-text-3': '#555555',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#E9FF3D', '--sf-accent-2': '#FF3D3D', '--sf-nav-h': '64px',
        '--sf-font': "'Arial Narrow',Impact,sans-serif",
      };
      case 'botanica': return {
        '--sf-bg': '#0F2318', '--sf-surface': '#17301F', '--sf-border': '#274430',
        '--sf-text-1': '#F3EFE4', '--sf-text-2': '#A9B8A0', '--sf-text-3': '#6E8271',
        '--sf-radius': '16px', '--sf-radius-sm': '12px', '--sf-radius-lg': '24px',
        '--sf-accent': '#D8A667', '--sf-accent-2': '#E8C9D0', '--sf-nav-h': '64px',
        '--sf-font': "Candara,'Segoe UI',sans-serif",
      };
      case 'prism': return {
        '--sf-bg': 'linear-gradient(135deg, #7B2FF7 0%, #F72585 50%, #4CC9F0 100%)',
        '--sf-surface': 'rgba(255,255,255,0.16)', '--sf-border': 'rgba(255,255,255,0.4)',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': 'rgba(255,255,255,0.8)', '--sf-text-3': 'rgba(255,255,255,0.55)',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FFFFFF', '--sf-accent-2': '#FFE066', '--sf-nav-h': '0px',
        '--sf-font': "'Arial Rounded MT Bold','Helvetica Neue',sans-serif",
      };
      case 'midnight': return {
        '--sf-bg': '#0B0B0F', '--sf-surface': '#151319', '--sf-border': '#C9A227',
        '--sf-text-1': '#F5F0E6', '--sf-text-2': '#B8AF9C', '--sf-text-3': '#6E6555',
        '--sf-radius': '12px', '--sf-radius-sm': '8px', '--sf-radius-lg': '16px',
        '--sf-accent': '#C9A227', '--sf-accent-2': '#7A6A2E', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
      case 'harmattan': return {
        '--sf-bg': '#EDE7D9', '--sf-surface': '#F8F5EC', '--sf-border': '#D8CFB8',
        '--sf-text-1': '#2E2A22', '--sf-text-2': '#6B6353', '--sf-text-3': '#9A9182',
        '--sf-radius': '6px', '--sf-radius-sm': '6px', '--sf-radius-lg': '10px',
        '--sf-accent': '#4C6B8A', '--sf-accent-2': '#8A7A62', '--sf-nav-h': '0px',
        '--sf-font': "'Courier New', monospace",
      };
      case 'neon': return {
        '--sf-bg': '#0A0A0A', '--sf-surface': '#111111', '--sf-border': '#00F0FF',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': '#9A9A9A', '--sf-text-3': '#555555',
        '--sf-radius': '6px', '--sf-radius-sm': '6px', '--sf-radius-lg': '10px',
        '--sf-accent': '#FF2E9A', '--sf-accent-2': '#00F0FF', '--sf-nav-h': '0px',
        '--sf-font': "'Courier New', monospace",
      };
      case 'sunset': return {
        '--sf-bg': 'linear-gradient(165deg, #6E3AFF 0%, #FF4D9D 55%, #FF7A45 100%)',
        '--sf-surface': 'rgba(255,255,255,0.14)', '--sf-border': 'rgba(255,255,255,0.45)',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': 'rgba(255,255,255,0.78)', '--sf-text-3': 'rgba(255,255,255,0.5)',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FFFFFF', '--sf-accent-2': '#FFD24C', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
      case 'mono': return {
        '--sf-bg': '#FFFFFF', '--sf-surface': '#FFFFFF', '--sf-border': '#000000',
        '--sf-text-1': '#000000', '--sf-text-2': '#555555', '--sf-text-3': '#999999',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#FF0000', '--sf-accent-2': '#000000', '--sf-nav-h': '0px',
        '--sf-font': "'Helvetica Neue', Arial, sans-serif",
      };
      case 'blush': return {
        '--sf-bg': '#FCE8EC', '--sf-surface': '#FFFFFF', '--sf-border': '#F4D4DA',
        '--sf-text-1': '#4A2E35', '--sf-text-2': '#9C7A82', '--sf-text-3': '#BBA0A7',
        '--sf-radius': '16px', '--sf-radius-sm': '10px', '--sf-radius-lg': '20px',
        '--sf-accent': '#D88C9A', '--sf-accent-2': '#E8B4BC', '--sf-nav-h': '0px',
        '--sf-font': "Georgia, 'Times New Roman', serif",
      };
      case 'rose': return {
        '--sf-bg': '#171114', '--sf-surface': '#221A1D', '--sf-border': '#3A2E31',
        '--sf-text-1': '#F2E9EA', '--sf-text-2': '#B79CA0', '--sf-text-3': '#7A6569',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#C97B8B', '--sf-accent-2': '#E8C4CB', '--sf-nav-h': '0px',
        '--sf-font': "Georgia, serif",
      };
      case 'pearl': return {
        '--sf-bg': 'linear-gradient(160deg, #F7D9E3 0%, #E0C3FC 50%, #C9E4F6 100%)',
        '--sf-surface': 'rgba(255,255,255,0.4)', '--sf-border': 'rgba(255,255,255,0.6)',
        '--sf-text-1': '#4A3B52', '--sf-text-2': 'rgba(74,59,82,0.7)', '--sf-text-3': 'rgba(74,59,82,0.45)',
        '--sf-radius': '16px', '--sf-radius-sm': '12px', '--sf-radius-lg': '24px',
        '--sf-accent': '#FFFFFF', '--sf-accent-2': '#F5A6C9', '--sf-nav-h': '0px',
        '--sf-font': "Verdana, system-ui, sans-serif",
      };
      case 'cherry': return {
        '--sf-bg': '#FF4D6D', '--sf-surface': '#FFFFFF', '--sf-border': '#C81E45',
        '--sf-text-1': '#1A1A1A', '--sf-text-2': '#FFE3EA', '--sf-text-3': '#F6B7C5',
        '--sf-radius': '16px', '--sf-radius-sm': '10px', '--sf-radius-lg': '20px',
        '--sf-accent': '#FFFFFF', '--sf-accent-2': '#FFD400', '--sf-nav-h': '0px',
        '--sf-font': "'Arial Black', Impact, sans-serif",
      };
      case 'quiet': return {
        '--sf-bg': '#111111', '--sf-surface': '#1A1A1A', '--sf-border': '#2A2A2A',
        '--sf-text-1': '#F0F0F0', '--sf-text-2': '#8A8A8A', '--sf-text-3': '#5A5A5A',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#B08968', '--sf-accent-2': '#3A3A3A', '--sf-nav-h': '0px',
        '--sf-font': "'Helvetica Neue', Arial, sans-serif",
      };
      case 'concrete': return {
        '--sf-bg': '#E5E3DE', '--sf-surface': '#FFFFFF', '--sf-border': '#D4D1C8',
        '--sf-text-1': '#2B2A28', '--sf-text-2': '#7A776E', '--sf-text-3': '#A5A29A',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-accent': '#8C8A82', '--sf-accent-2': '#C9C6BC', '--sf-nav-h': '0px',
        '--sf-font': "Arial, 'Helvetica Neue', sans-serif",
      };
      case 'chrome': return {
        '--sf-bg': 'linear-gradient(160deg, #3A3D42 0%, #6E7378 50%, #B8BCC2 100%)',
        '--sf-surface': 'rgba(255,255,255,0.14)', '--sf-border': 'rgba(255,255,255,0.35)',
        '--sf-text-1': '#FFFFFF', '--sf-text-2': 'rgba(255,255,255,0.7)', '--sf-text-3': 'rgba(255,255,255,0.45)',
        '--sf-radius': '8px', '--sf-radius-sm': '6px', '--sf-radius-lg': '12px',
        '--sf-accent': '#00E5FF', '--sf-accent-2': '#FFFFFF', '--sf-nav-h': '0px',
        '--sf-font': "Arial, 'Helvetica Neue', sans-serif",
      };
      default: return {
        '--sf-bg': '#FFC93C', '--sf-surface': '#FFFFFF', '--sf-border': '#1A1A1A',
        '--sf-text-1': '#1A1A1A', '--sf-text-2': '#4A4A4A', '--sf-text-3': '#6B6B6B',
        '--sf-radius': '999px', '--sf-radius-sm': '999px', '--sf-radius-lg': '999px',
        '--sf-accent': '#FF3E7F', '--sf-accent-2': '#00A896', '--sf-nav-h': '0px',
        '--sf-font': 'system-ui, sans-serif',
      };
    }
  })();
  return { ...base, ...themeVars } as CSSProperties;
}
