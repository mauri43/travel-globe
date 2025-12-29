import { useTheme } from '../hooks/useTheme';

interface ThemeButtonProps {
  onClick: () => void;
}

export function ThemeButton({ onClick }: ThemeButtonProps) {
  const { currentTheme, nextUnlockProgress } = useTheme();
  const glowColor = `#${currentTheme.colors.glowColor.toString(16).padStart(6, '0')}`;

  return (
    <button
      className="theme-button"
      onClick={onClick}
      title="Change Globe Theme"
      style={{
        '--theme-glow': glowColor,
      } as React.CSSProperties}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      {nextUnlockProgress && (
        <span className="theme-badge">
          {Math.round(nextUnlockProgress.progress * 100)}%
        </span>
      )}
    </button>
  );
}
