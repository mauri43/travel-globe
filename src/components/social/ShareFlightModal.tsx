import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';
import type { Friend } from '../../types/social';

interface ShareFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
}

export function ShareFlightModal({ isOpen, onClose, cityId, cityName }: ShareFlightModalProps) {
  const { friends, loadFriends, shareFlightWithFriends } = useSocialStore();
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load friends when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFriends();
      setSelectedUsernames([]);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, loadFriends]);

  const toggleFriend = (username: string) => {
    setSelectedUsernames((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleShare = async () => {
    if (selectedUsernames.length === 0) {
      setError('Select at least one friend to share with');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      await shareFlightWithFriends(cityId, selectedUsernames);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share flight');
    } finally {
      setIsSharing(false);
    }
  };

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');

  return (
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
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 60,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              backgroundColor: '#1a1a2e',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              zIndex: 61,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                Share Flight
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginTop: '4px' }}>
                Share "{cityName}" with friends
              </p>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                  <div style={{ color: '#22c55e', fontSize: '16px', fontWeight: '600' }}>
                    Flight shared successfully!
                  </div>
                </motion.div>
              ) : acceptedFriends.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <div>No friends to share with</div>
                  <div style={{ fontSize: '13px', marginTop: '8px' }}>
                    Add some friends first!
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                      Select friends to share this flight with:
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {acceptedFriends.map((friend) => (
                      <FriendCheckbox
                        key={friend.username}
                        friend={friend}
                        isSelected={selectedUsernames.includes(friend.username)}
                        onToggle={() => toggleFriend(friend.username)}
                      />
                    ))}
                  </div>

                  {error && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '13px',
                      }}
                    >
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={isSharing || selectedUsernames.length === 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: selectedUsernames.length === 0 ? 'rgba(59, 130, 246, 0.3)' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSharing || selectedUsernames.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: isSharing ? 0.7 : 1,
                  }}
                >
                  {isSharing ? 'Sharing...' : `Share with ${selectedUsernames.length || ''} friend${selectedUsernames.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface FriendCheckboxProps {
  friend: Friend;
  isSelected: boolean;
  onToggle: () => void;
}

function FriendCheckbox({ friend, isSelected, onToggle }: FriendCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid',
        borderColor: isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.2s',
      }}
    >
      {/* Checkbox */}
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          backgroundColor: isSelected ? '#3b82f6' : 'transparent',
          border: '2px solid',
          borderColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isSelected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
        }}
      >
        {friend.displayName?.[0]?.toUpperCase() || friend.username[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
          {friend.displayName || friend.username}
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
          @{friend.username}
        </div>
      </div>
    </button>
  );
}
