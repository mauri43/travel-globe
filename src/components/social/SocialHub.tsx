import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import type { SocialTab } from '../../store/socialStore';
import { FriendsTab } from './FriendsTab';
import { FollowersTab } from './FollowersTab';
import { SearchTab } from './SearchTab';
import { SharedFlightsTab } from './SharedFlightsTab';
import { NotificationsTab } from './NotificationsTab';

interface SocialHubProps {
  isOpen: boolean;
  onClose: () => void;
  onViewGlobe: (username: string) => void;
  onFlightAdded?: (cityId: string) => void;
}

const tabs: { id: SocialTab; label: string; icon: string }[] = [
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'followers', label: 'Followers', icon: '👤' },
  { id: 'shared', label: 'Shared', icon: '✈️' },
  { id: 'notifications', label: 'Alerts', icon: '🔔' },
  { id: 'search', label: 'Search', icon: '🔍' },
];

export function SocialHub({ isOpen, onClose, onViewGlobe, onFlightAdded }: SocialHubProps) {
  const {
    activeTab,
    setActiveTab,
    unreadCount,
    pendingRequests,
    pendingSharedFlights,
    username,
    setUsernameSetupOpen,
    refreshUnreadCount,
    loadFriends,
  } = useSocialStore();

  // Refresh data when hub opens
  useEffect(() => {
    if (isOpen && username) {
      refreshUnreadCount();
      loadFriends();
    }
  }, [isOpen, username, refreshUnreadCount, loadFriends]);

  // Check if username needs to be set
  useEffect(() => {
    if (isOpen && !username) {
      setUsernameSetupOpen(true);
    }
  }, [isOpen, username, setUsernameSetupOpen]);

  const getBadgeCount = (tabId: SocialTab): number => {
    switch (tabId) {
      case 'friends':
        return pendingRequests.length;
      case 'shared':
        return pendingSharedFlights.length;
      case 'notifications':
        return unreadCount;
      default:
        return 0;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return <FriendsTab onViewGlobe={onViewGlobe} />;
      case 'followers':
        return <FollowersTab onViewGlobe={onViewGlobe} />;
      case 'search':
        return <SearchTab onViewGlobe={onViewGlobe} />;
      case 'shared':
        return <SharedFlightsTab onFlightAdded={onFlightAdded} />;
      case 'notifications':
        return (
          <NotificationsTab
            onNavigateToFriends={() => setActiveTab('friends')}
            onNavigateToShared={() => setActiveTab('shared')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Main Social Hub */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 40,
              }}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '380px',
                maxWidth: '100vw',
                backgroundColor: '#1a1a2e',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                overflowX: 'hidden',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                    Social
                  </h2>
                  {username && (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', marginTop: '2px' }}>
                      @{username}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: 'white',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  padding: '12px 16px',
                  gap: '8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  overflowX: 'auto',
                }}
              >
                {tabs.map((tab) => {
                  const badge = getBadgeCount(tab.id);
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid',
                        borderColor: isActive ? 'rgba(59, 130, 246, 0.4)' : 'transparent',
                        borderRadius: '20px',
                        color: isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '400',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        position: 'relative',
                      }}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {badge > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            minWidth: '18px',
                            height: '18px',
                            backgroundColor: tab.id === 'notifications' ? '#ef4444' : '#3b82f6',
                            color: 'white',
                            borderRadius: '9px',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 4px',
                          }}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    style={{ height: '100%' }}
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
