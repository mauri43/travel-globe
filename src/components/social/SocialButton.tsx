import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';

interface SocialButtonProps {
  onClick: () => void;
}

export function SocialButton({ onClick }: SocialButtonProps) {
  const { unreadCount, pendingRequests, pendingSharedFlights, refreshUnreadCount } = useSocialStore();

  // Refresh count periodically
  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const totalBadge = unreadCount + pendingRequests.length + pendingSharedFlights.length;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        left: 'calc(var(--space-xl, 24px) + 228px)',
        bottom: 'var(--space-xl, 24px)',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
      }}
    >
      👥
      {totalBadge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '22px',
            height: '22px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '11px',
            fontSize: '12px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            border: '2px solid #1a1a2e',
          }}
        >
          {totalBadge > 99 ? '99+' : totalBadge}
        </span>
      )}
    </motion.button>
  );
}
