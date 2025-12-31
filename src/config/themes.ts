// Globe Theme Configuration
// Progressive unlock system - themes unlock as users visit more places

export type ThemeTierId = 'starter' | 'bronze' | 'sapphire' | 'gold' | 'obsidian' | 'celestial';

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
  animatedGlow?: boolean;       // Animated color cycling
  holographicShader?: boolean;  // Prismatic effects
  particleTrails?: boolean;     // Flight path particles
  volcanicCracks?: boolean;     // Obsidian: lava crack effect
  nebulaEffect?: boolean;       // Celestial: cosmic nebula
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
  requiredPlaces?: number; // Alternative unlock via places visited
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
    requiredCountries: 10,
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

  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Sailor',
    displayName: 'Sapphire Sailor',
    description: 'Deep royal blues with moonlit ocean shimmer',
    requiredCountries: 25,
    colors: {
      glowColor: 0x1e90ff,
      oceanColor: 0x0a1628,
      landColor: 0x050510,
      borderColor: '#4169e1',
      flightPathColor: '#87ceeb',
      usMarkerColor: '#4169e1',
      usMarkerHoverColor: '#6495ed',
      intlMarkerColor: '#c0c0c0',
      intlMarkerHoverColor: '#e8e8e8',
      accentLightColor: '#1e90ff',
      starSaturation: 0.25,
    },
    features: {
      animatedGlow: true,
    },
    animation: {
      glowCycleSpeed: 0.4,
      colorPalette: [0x1e90ff, 0x4169e1, 0x6495ed, 0x87ceeb, 0x1e90ff],
    },
  },

  gold: {
    id: 'gold',
    name: 'Gold Legend',
    displayName: 'Gold Legend',
    description: 'Holographic prismatic shader effects',
    requiredCountries: 999, // Use requiredPlaces instead
    requiredPlaces: 50,
    colors: {
      glowColor: 0xffd700,
      oceanColor: 0x1a1a2e,
      landColor: 0x080808,
      borderColor: '#ffd700',
      flightPathColor: '#ffec8b',
      usMarkerColor: '#ffd700',
      usMarkerHoverColor: '#fff8dc',
      intlMarkerColor: '#ff1493',
      intlMarkerHoverColor: '#ff69b4',
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

  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Odyssey',
    displayName: 'Obsidian Odyssey',
    description: 'Volcanic black globe with ember lava cracks',
    requiredCountries: 50,
    colors: {
      glowColor: 0xff4500,
      oceanColor: 0x0a0505,
      landColor: 0x020202,
      borderColor: '#ff4500',
      flightPathColor: '#ff6347',
      usMarkerColor: '#ff4500',
      usMarkerHoverColor: '#ff6347',
      intlMarkerColor: '#ffa500',
      intlMarkerHoverColor: '#ffd700',
      accentLightColor: '#ff4500',
      starSaturation: 0.1,
    },
    features: {
      animatedGlow: true,
      holographicShader: true,
      volcanicCracks: true,
    },
    animation: {
      glowCycleSpeed: 0.2,
      colorPalette: [0xff4500, 0xff6347, 0xff8c00, 0xdc143c, 0xff4500],
    },
  },

  celestial: {
    id: 'celestial',
    name: 'Celestial Champion',
    displayName: 'Celestial Champion',
    description: 'Galaxy nebula with cosmic dust and stars',
    requiredCountries: 100,
    colors: {
      glowColor: 0x9400d3,
      oceanColor: 0x0d0520,
      landColor: 0x030308,
      borderColor: '#9400d3',
      flightPathColor: '#da70d6',
      usMarkerColor: '#9370db',
      usMarkerHoverColor: '#ba55d3',
      intlMarkerColor: '#ff69b4',
      intlMarkerHoverColor: '#ff1493',
      accentLightColor: '#9400d3',
      starSaturation: 0.5,
    },
    features: {
      animatedGlow: true,
      holographicShader: true,
      particleTrails: true,
      nebulaEffect: true,
    },
    animation: {
      glowCycleSpeed: 0.15,
      colorPalette: [0x9400d3, 0xff69b4, 0x00bfff, 0x8a2be2, 0x9400d3],
    },
  },
};

export const THEME_ORDER: ThemeTierId[] = ['starter', 'bronze', 'sapphire', 'gold', 'obsidian', 'celestial'];

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
