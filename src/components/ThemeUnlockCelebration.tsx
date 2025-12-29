import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import type { ThemeTierId, ThemeConfig } from '../config/themes';

export function ThemeUnlockCelebration() {
  const { unlockedThemes, allThemes } = useTheme();
  const [celebratingTheme, setCelebratingTheme] = useState<ThemeConfig | null>(null);
  const previousUnlockedRef = useRef<ThemeTierId[]>([]);

  useEffect(() => {
    // Check for newly unlocked themes
    const previousUnlocked = previousUnlockedRef.current;
    const newlyUnlocked = unlockedThemes.filter(
      (themeId) => !previousUnlocked.includes(themeId) && themeId !== 'starter'
    );

    if (newlyUnlocked.length > 0 && previousUnlocked.length > 0) {
      // Celebrate the first newly unlocked theme
      const themeToShow = allThemes[newlyUnlocked[0]];
      setCelebratingTheme(themeToShow);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setCelebratingTheme(null);
      }, 5000);

      return () => clearTimeout(timer);
    }

    previousUnlockedRef.current = unlockedThemes;
  }, [unlockedThemes, allThemes]);

  const handleDismiss = () => {
    setCelebratingTheme(null);
  };

  if (!celebratingTheme) return null;

  const glowColor = `#${celebratingTheme.colors.glowColor.toString(16).padStart(6, '0')}`;

  return (
    <AnimatePresence>
      {celebratingTheme && (
        <motion.div
          className="unlock-celebration"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="celebration-content"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            style={{
              '--glow-color': glowColor,
            } as React.CSSProperties}
          >
            {/* Animated unlock icon */}
            <motion.div
              className="unlock-icon"
              initial={{ rotate: -10, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            >
              <motion.div
                className="lock-shackle"
                initial={{ y: 0 }}
                animate={{ y: -8, rotate: -30 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              />
              <div className="lock-body" />
            </motion.div>

            {/* Sparkles */}
            <div className="sparkles">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="sparkle"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i / 12) * Math.PI * 2) * 80,
                    y: Math.sin((i / 12) * Math.PI * 2) * 80,
                  }}
                  transition={{
                    delay: 0.5 + i * 0.05,
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                  style={{ background: glowColor }}
                />
              ))}
            </div>

            {/* Theme name */}
            <motion.h2
              className="unlock-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{ color: glowColor }}
            >
              Theme Unlocked!
            </motion.h2>

            <motion.h3
              className="theme-unlocked-name"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {celebratingTheme.displayName}
            </motion.h3>

            <motion.p
              className="theme-unlocked-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {celebratingTheme.description}
            </motion.p>

            <motion.p
              className="tap-to-dismiss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.2 }}
            >
              Tap anywhere to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
