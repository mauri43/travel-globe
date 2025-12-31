import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import type { ThemeTierId, ThemeConfig } from '../config/themes';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

function ThemePreviewOrb({ theme, isSelected }: { theme: ThemeConfig; isSelected: boolean }) {
  const glowColor = `#${theme.colors.glowColor.toString(16).padStart(6, '0')}`;
  const oceanColor = `#${theme.colors.oceanColor.toString(16).padStart(6, '0')}`;

  return (
    <div
      className={`theme-preview-orb ${isSelected ? 'selected' : ''}`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${glowColor}40, ${oceanColor} 60%, #000 100%)`,
        boxShadow: isSelected
          ? `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40, inset 0 0 20px ${glowColor}30`
          : `0 0 10px ${glowColor}40, inset 0 0 15px ${glowColor}20`,
        borderColor: isSelected ? glowColor : 'transparent',
      }}
    >
      <div
        className="orb-glow-ring"
        style={{ borderColor: `${glowColor}60` }}
      />
    </div>
  );
}

function FeatureBadge({ feature }: { feature: string }) {
  const badges: Record<string, { icon: string; label: string }> = {
    animatedGlow: { icon: '✨', label: 'Aurora' },
    holographicShader: { icon: '🌈', label: 'Holographic' },
    particleTrails: { icon: '💫', label: 'Particles' },
    volcanicCracks: { icon: '🌋', label: 'Volcanic' },
    nebulaEffect: { icon: '🌌', label: 'Nebula' },
  };

  const badge = badges[feature];
  if (!badge) return null;

  return (
    <span className="feature-badge">
      <span className="badge-icon">{badge.icon}</span>
      <span className="badge-label">{badge.label}</span>
    </span>
  );
}

export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const {
    selectedTheme,
    setSelectedTheme,
    unlockedThemes,
    uniqueCountries,
    nextUnlockProgress,
    allThemes,
    themeOrder,
  } = useTheme();

  const handleThemeSelect = (themeId: ThemeTierId) => {
    if (unlockedThemes.includes(themeId)) {
      setSelectedTheme(themeId);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="theme-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="theme-panel"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="theme-header">
              <h2>Globe Themes</h2>
              <button className="theme-close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="theme-content">
              {/* Progress Section */}
              <div className="theme-progress-section">
                <div className="countries-count">
                  <span className="count-number">{uniqueCountries}</span>
                  <span className="count-label">Countries Visited</span>
                </div>

                {nextUnlockProgress && (
                  <div className="next-unlock">
                    <div className="unlock-info">
                      <span className="unlock-label">Next unlock:</span>
                      <span className="unlock-theme">{nextUnlockProgress.theme.displayName}</span>
                      <span className="unlock-count">
                        {nextUnlockProgress.current}/{nextUnlockProgress.required} {nextUnlockProgress.type}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${nextUnlockProgress.progress * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{
                          background: `linear-gradient(90deg,
                            #${nextUnlockProgress.theme.colors.glowColor.toString(16).padStart(6, '0')}80,
                            #${nextUnlockProgress.theme.colors.glowColor.toString(16).padStart(6, '0')}
                          )`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {!nextUnlockProgress && (
                  <div className="all-unlocked">
                    <span className="trophy">🏆</span>
                    <span>All themes unlocked!</span>
                  </div>
                )}
              </div>

              {/* Theme Grid */}
              <div className="theme-grid">
                {themeOrder.map((themeId) => {
                  const theme = allThemes[themeId];
                  const isUnlocked = unlockedThemes.includes(themeId);
                  const isSelected = selectedTheme === themeId;
                  const features = theme.features ? Object.keys(theme.features).filter(k => theme.features?.[k as keyof typeof theme.features]) : [];

                  return (
                    <motion.button
                      key={themeId}
                      className={`theme-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
                      onClick={() => handleThemeSelect(themeId)}
                      disabled={!isUnlocked}
                      whileHover={isUnlocked ? { scale: 1.02 } : undefined}
                      whileTap={isUnlocked ? { scale: 0.98 } : undefined}
                    >
                      <ThemePreviewOrb theme={theme} isSelected={isSelected} />

                      <div className="theme-info">
                        <h3 className="theme-name">{theme.displayName}</h3>
                        <p className="theme-description">{theme.description}</p>

                        {features.length > 0 && (
                          <div className="theme-features">
                            {features.map(f => <FeatureBadge key={f} feature={f} />)}
                          </div>
                        )}

                        <div className="theme-requirement">
                          {isUnlocked ? (
                            <span className="unlocked-text">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <polyline points="20,6 9,17 4,12" />
                              </svg>
                              Unlocked
                            </span>
                          ) : (
                            <span className="locked-text">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              {theme.requiredPlaces !== undefined
                                ? `${theme.requiredPlaces} places`
                                : `${theme.requiredCountries} countries`}
                            </span>
                          )}
                        </div>
                      </div>

                      {!isUnlocked && (
                        <div className="lock-overlay">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
