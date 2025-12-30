import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import type { Notification, NotificationType } from '../../types/social';

interface NotificationsTabProps {
  onNavigateToFriends: () => void;
  onNavigateToShared: () => void;
}

export function NotificationsTab({ onNavigateToFriends, onNavigateToShared }: NotificationsTabProps) {
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    loadNotifications,
    markNotificationsRead,
  } = useSocialStore();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    await markNotificationsRead('all');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'friend_request':
      case 'friend_request_accepted':
        onNavigateToFriends();
        break;
      case 'flight_tag':
      case 'flight_tag_accepted':
        onNavigateToShared();
        break;
      case 'new_follower':
        // Could navigate to followers tab
        break;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          Notifications
          {unreadCount > 0 && (
            <span
              style={{
                marginLeft: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notificationsLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <div>No notifications yet</div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const notificationConfig: Record<
  NotificationType,
  { icon: string; getMessage: (data: Notification['data']) => string }
> = {
  friend_request: {
    icon: '👋',
    getMessage: (data) => `@${data.fromUsername} sent you a friend request`,
  },
  friend_request_accepted: {
    icon: '🎉',
    getMessage: (data) => `@${data.fromUsername} accepted your friend request`,
  },
  flight_tag: {
    icon: '✈️',
    getMessage: (data) => `@${data.fromUsername} shared a flight with you: ${data.flightName}`,
  },
  flight_tag_accepted: {
    icon: '✅',
    getMessage: (data) => `@${data.fromUsername} accepted your shared flight`,
  },
  new_follower: {
    icon: '👤',
    getMessage: (data) => `@${data.followerUsername} started following you`,
  },
};

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const config = notificationConfig[notification.type];
  const message = config.getMessage(notification.data);
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px',
        marginBottom: '8px',
        backgroundColor: notification.read
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(59, 130, 246, 0.1)',
        borderRadius: '12px',
        border: '1px solid',
        borderColor: notification.read
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(59, 130, 246, 0.2)',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: notification.read ? 'rgba(255, 255, 255, 0.7)' : 'white',
            fontSize: '14px',
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '12px',
            marginTop: '4px',
          }}
        >
          {timeAgo}
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            flexShrink: 0,
            marginTop: '6px',
          }}
        />
      )}
    </motion.div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
