export interface ThemeTokens {
  id: string;
  name: string;
  brand: string;
  bg: string;
  surface: string;
  text: string;
  subtext: string;
  accent: string;
  accent2: string;
  border: string;
  fontDisplay: string;
  fontBody: string;
  radius: number;
  deco: string;
}

export const THEME_TOKENS: Record<string, ThemeTokens> = {
  atelier: {
    id: 'atelier', name: 'Atelier Noir', brand: 'ATELIER',
    bg: '#0B0B0B', surface: '#161616', text: '#F5F5F0', subtext: '#9C9C94',
    accent: '#D4AF6A', accent2: '#FFFFFF', border: '#2A2A2A',
    fontDisplay: "Georgia, 'Times New Roman', serif", fontBody: 'system-ui, sans-serif',
    radius: 0, deco: 'hairline',
  },
  citrus: {
    id: 'citrus', name: 'Citrus Market', brand: 'CITRUS & CO',
    bg: '#FFF4DE', surface: '#FFFFFF', text: '#1F2A1A', subtext: '#5C6B52',
    accent: '#FF7A1A', accent2: '#8BC53F', border: '#FFDDA8',
    fontDisplay: 'Verdana, system-ui, sans-serif', fontBody: 'system-ui, sans-serif',
    radius: 999, deco: 'dots',
  },
  nordly: {
    id: 'nordly', name: 'Nordic Minimal', brand: 'NORDLY',
    bg: '#F7F5F0', surface: '#FFFFFF', text: '#22201C', subtext: '#8A8479',
    accent: '#5B6B58', accent2: '#B7ADA0', border: '#E4DFD3',
    fontDisplay: "'Century Gothic', system-ui, sans-serif", fontBody: 'system-ui, sans-serif',
    radius: 4, deco: 'grid-lines',
  },
  neotech: {
    id: 'neotech', name: 'Neo Tech', brand: 'NEOTECH',
    bg: '#0A0E17', surface: '#121826', text: '#E8ECFF', subtext: '#7C879E',
    accent: '#3D8BFF', accent2: '#00FFC2', border: '#233047',
    fontDisplay: "Arial, 'Helvetica Neue', sans-serif", fontBody: "'Courier New', monospace",
    radius: 8, deco: 'glow',
  },
  terra: {
    id: 'terra', name: 'Terra Craft', brand: 'TERRA & CO',
    bg: '#F1EEE4', surface: '#FFFFFF', text: '#3A3327', subtext: '#8A8065',
    accent: '#6B7A4F', accent2: '#B5652E', border: '#E2DCC8',
    fontDisplay: "'Trebuchet MS', system-ui, sans-serif", fontBody: 'system-ui, sans-serif',
    radius: 12, deco: 'texture',
  },
  volt: {
    id: 'volt', name: 'Neon Streetwear', brand: 'VOLT',
    bg: '#000000', surface: '#111111', text: '#FFFFFF', subtext: '#9A9A9A',
    accent: '#E9FF3D', accent2: '#FF3D3D', border: '#2A2A2A',
    fontDisplay: "'Arial Narrow', Impact, sans-serif", fontBody: "'Courier New', monospace",
    radius: 0, deco: 'neon-grid',
  },
  botanica: {
    id: 'botanica', name: 'Botanica', brand: 'BOTANICA',
    bg: '#0F2318', surface: '#17301F', text: '#F3EFE4', subtext: '#A9B8A0',
    accent: '#D8A667', accent2: '#E8C9D0', border: '#274430',
    fontDisplay: "Candara, 'Segoe UI', sans-serif", fontBody: 'system-ui, sans-serif',
    radius: 16, deco: 'leaf',
  },
  prism: {
    id: 'prism', name: 'Prism Studio', brand: 'PRISM',
    bg: 'linear-gradient(135deg, #7B2FF7 0%, #F72585 50%, #4CC9F0 100%)',
    surface: 'rgba(255,255,255,0.16)', text: '#FFFFFF', subtext: 'rgba(255,255,255,0.8)',
    accent: '#FFFFFF', accent2: '#FFE066', border: 'rgba(255,255,255,0.4)',
    fontDisplay: "'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif", fontBody: 'system-ui, sans-serif',
    radius: 999, deco: 'holo',
  },
};

export function isDarkBg(t: ThemeTokens): boolean {
  return t.bg === '#000000' || t.bg.indexOf('#0') === 0 || t.id === 'prism';
}

export function accentText(t: ThemeTokens): string {
  if (t.id === 'citrus' || t.id === 'volt' || t.id === 'nordly') return '#fff';
  if (t.id === 'prism') return '#7B2FF7';
  return t.bg.startsWith('#') ? t.bg : '#111';
}
