// Globe Theme Configuration
// Progressive unlock system - themes unlock as users visit more countries

export type ThemeTierId = 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface ThemeColors {
  // Globe shaders (hex numbers for Three.js)
  glowColor: number;
  oceanColor: number;
  landColor: number;

  // UI elements (CSS strings)
  borderColor: string;
  flightPathColor: string;

  // City markers
  usMarkerColor: string;
  usMarkerHoverColor: string;
  intlMarkerColor: string;
  intlMarkerHoverColor: string;

  // Scene lighting
  accentLightColor: string;

  // Stars
  starSaturation: number;
}

export interface ThemeFeatures {
  animatedGlow?: boolean;       // Silver: aurora color cycling
  holographicShader?: boolean;  // Gold: prismatic effects
  particleTrails?: boolean;     // Platinum: flight path particles
}

export interface ThemeAnimation {
  glowCycleSpeed?: number;      // Speed of color cycling
  colorPalette?: number[];      // Colors to cycle through (hex)
}

export interface ThemeConfig {
  id: ThemeTierId;
  name: string;
  displayName: string;
  description: string;
  requiredCountries: number;
  colors: ThemeColors;
  features?: ThemeFeatures;
  animation?: ThemeAnimation;
}

export const THEMES: Record<ThemeTierId, ThemeConfig> = {
  starter: {
    id: 'starter',
    name: 'Cosmic Voyager',
    displayName: 'Starter',
    description: 'The default cyan cosmic theme',
    requiredCountries: 0,
    colors: {
      glowColor: 0x00f5ff,
      oceanColor: 0x095880,
      landColor: 0x050508,
      borderColor: '#00f5ff',
      flightPathColor: '#00f5ff',
      usMarkerColor: '#4a90d9',
      usMarkerHoverColor: '#6bb3ff',
      intlMarkerColor: '#ff6b35',
      intlMarkerHoverColor: '#ffd93d',
      accentLightColor: '#00f5ff',
      starSaturation: 0,
    },
  },

  bronze: {
    id: 'bronze',
    name: 'Bronze Explorer',
    displayName: 'Bronze Explorer',
    description: 'Warm golden tones for the adventurous',
    requiredCountries: 5,
    colors: {
      glowColor: 0xffa500,
      oceanColor: 0x1a3a4a,
      landColor: 0x0a0806,
      borderColor: '#cd7f32',
      flightPathColor: '#daa520',
      usMarkerColor: '#cd7f32',
      usMarkerHoverColor: '#daa520',
      intlMarkerColor: '#ff8c00',
      intlMarkerHoverColor: '#ffd700',
      accentLightColor: '#ffa500',
      starSaturation: 0.15,
    },
  },

  silver: {
    id: 'silver',
    name: 'Silver Voyager',
    displayName: 'Silver Voyager',
    description: 'Aurora borealis with animated color cycling',
    requiredCountries: 15,
    colors: {
      glowColor: 0x00ff88,
      oceanColor: 0x0a2030,
      landColor: 0x050808,
      borderColor: '#88ffcc',
      flightPathColor: '#66ffaa',
      usMarkerColor: '#40e0d0',
      usMarkerHoverColor: '#7fffd4',
      intlMarkerColor: '#98fb98',
      intlMarkerHoverColor: '#adff2f',
      accentLightColor: '#00ff88',
      starSaturation: 0.2,
    },
    features: {
      animatedGlow: true,
    },
    animation: {
      glowCycleSpeed: 0.5,
      colorPalette: [0x00ff88, 0x00ffff, 0x88ff00, 0xff00ff, 0x00ff88],
    },
  },

  gold: {
    id: 'gold',
    name: 'Gold Legend',
    displayName: 'Gold Legend',
    description: 'Holographic prismatic shader effects',
    requiredCountries: 30,
    colors: {
      glowColor: 0xffd700,
      oceanColor: 0x1a1a2e,
      landColor: 0x080808,
      borderColor: '#ffd700',
      flightPathColor: '#ffec8b',
      usMarkerColor: '#ffd700',
      usMarkerHoverColor: '#ffec8b',
      intlMarkerColor: '#ff69b4',
      intlMarkerHoverColor: '#ff1493',
      accentLightColor: '#ffd700',
      starSaturation: 0.3,
    },
    features: {
      animatedGlow: true,
      holographicShader: true,
    },
    animation: {
      glowCycleSpeed: 0.3,
      colorPalette: [0xffd700, 0xff69b4, 0x00bfff, 0x9400d3, 0xffd700],
    },
  },

  platinum: {
    id: 'platinum',
    name: 'Platinum Nomad',
    displayName: 'Platinum Nomad',
    description: 'Particle trails on flights, ultimate prestige',
    requiredCountries: 50,
    colors: {
      glowColor: 0xe5e4e2,
      oceanColor: 0x0f0f1a,
      landColor: 0x050505,
      borderColor: '#e5e4e2',
      flightPathColor: '#c0c0c0',
      usMarkerColor: '#c0c0c0',
      usMarkerHoverColor: '#e5e4e2',
      intlMarkerColor: '#dda0dd',
      intlMarkerHoverColor: '#ee82ee',
      accentLightColor: '#e5e4e2',
      starSaturation: 0.1,
    },
    features: {
      animatedGlow: true,
      holographicShader: true,
      particleTrails: true,
    },
    animation: {
      glowCycleSpeed: 0.2,
      colorPalette: [0xe5e4e2, 0xdda0dd, 0x87ceeb, 0xfafad2, 0xe5e4e2],
    },
  },
};

export const THEME_ORDER: ThemeTierId[] = ['starter', 'bronze', 'silver', 'gold', 'platinum'];

// Helper to get theme by country count
export function getUnlockedThemes(countryCount: number): ThemeTierId[] {
  return THEME_ORDER.filter(
    themeId => THEMES[themeId].requiredCountries <= countryCount
  );
}

// Helper to get highest unlocked theme
export function getHighestUnlockedTheme(countryCount: number): ThemeTierId {
  const unlocked = getUnlockedThemes(countryCount);
  return unlocked[unlocked.length - 1] || 'starter';
}
