import { useMemo } from 'react';
import { useStore } from '../store';
import { THEMES, THEME_ORDER } from '../config/themes';
import type { ThemeTierId, ThemeConfig } from '../config/themes';

interface NextUnlockProgress {
  theme: ThemeConfig;
  current: number;
  required: number;
  progress: number;
  type: 'countries' | 'places';
}

interface UseThemeReturn {
  currentTheme: ThemeConfig;
  selectedTheme: ThemeTierId;
  setSelectedTheme: (themeId: ThemeTierId) => void;
  unlockedThemes: ThemeTierId[];
  uniqueCountries: number;
  nextUnlockProgress: NextUnlockProgress | null;
  allThemes: typeof THEMES;
  themeOrder: typeof THEME_ORDER;
}

export function useTheme(): UseThemeReturn {
  const cities = useStore((state) => state.cities);
  const selectedTheme = useStore((state) => state.selectedTheme);
  const setSelectedTheme = useStore((state) => state.setSelectedTheme);

  // Calculate unique countries visited
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    cities.forEach(city => {
      if (city.country) {
        // Normalize country names for accurate counting
        const normalized = city.country.toLowerCase().trim();
        if (normalized && normalized !== 'unknown') {
          countries.add(normalized);
        }
      }
    });
    return countries.size;
  }, [cities]);

  // Total places visited
  const totalPlaces = cities.length;

  // Determine unlocked themes based on country count OR places count
  const unlockedThemes = useMemo(() => {
    return THEME_ORDER.filter(themeId => {
      const theme = THEMES[themeId];
      // Check places requirement first (if set)
      if (theme.requiredPlaces !== undefined) {
        return totalPlaces >= theme.requiredPlaces;
      }
      // Otherwise check countries
      return theme.requiredCountries <= uniqueCountries;
    });
  }, [uniqueCountries, totalPlaces]);

  // Get current theme config (fallback to starter if selected is locked)
  const currentTheme = useMemo(() => {
    if (!unlockedThemes.includes(selectedTheme)) {
      return THEMES.starter;
    }
    return THEMES[selectedTheme];
  }, [selectedTheme, unlockedThemes]);

  // Calculate progress toward next unlock
  const nextUnlockProgress = useMemo((): NextUnlockProgress | null => {
    const lockedThemes = THEME_ORDER.filter(
      themeId => !unlockedThemes.includes(themeId)
    );

    if (lockedThemes.length === 0) {
      return null; // All themes unlocked!
    }

    const nextTheme = THEMES[lockedThemes[0]];

    // Check if this theme uses places or countries
    if (nextTheme.requiredPlaces !== undefined) {
      return {
        theme: nextTheme,
        current: totalPlaces,
        required: nextTheme.requiredPlaces,
        progress: Math.min(1, totalPlaces / nextTheme.requiredPlaces),
        type: 'places',
      };
    }

    return {
      theme: nextTheme,
      current: uniqueCountries,
      required: nextTheme.requiredCountries,
      progress: Math.min(1, uniqueCountries / nextTheme.requiredCountries),
      type: 'countries',
    };
  }, [unlockedThemes, uniqueCountries, totalPlaces]);

  return {
    currentTheme,
    selectedTheme,
    setSelectedTheme,
    unlockedThemes,
    uniqueCountries,
    nextUnlockProgress,
    allThemes: THEMES,
    themeOrder: THEME_ORDER,
  };
}
