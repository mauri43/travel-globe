import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FriendWithProfile, FlightTagPermission } from '../../types/social';

interface FriendCardProps {
  friend: FriendWithProfile;
  onRemove: (friendshipId: string) => Promise<void>;
  onSetFlightOverride: (friendshipId: string, override: FlightTagPermission | null) => Promise<void>;
  onViewGlobe: (username: string) => void;
}

const permissionLabels: Record<FlightTagPermission, string> = {
  approve_required: 'Ask me',
  auto_approve: 'Auto-approve',
  auto_deny: 'Auto-deny',
};

export function FriendCard({ friend, onRemove, onSetFlightOverride, onViewGlobe }: FriendCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(friend.friendshipId);
    } catch {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
    }
  };

  const handleOverrideChange = async (override: FlightTagPermission | null) => {
    await onSetFlightOverride(friend.friendshipId, override);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'white',
            flexShrink: 0,
          }}
        >
          {friend.username.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>
            @{friend.username}
          </div>
          {friend.displayName && (
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
              {friend.displayName}
            </div>
          )}
          <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', marginTop: '2px' }}>
            Friends since {new Date(friend.friendSince).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onViewGlobe(friend.username)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            🌍 View
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Flight tag override */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '8px' }}>
              When {friend.username} adds me to a flight:
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['approve_required', 'auto_approve', 'auto_deny'] as FlightTagPermission[]).map((perm) => (
                <button
                  key={perm}
                  onClick={() => handleOverrideChange(friend.flightTagOverride === perm ? null : perm)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    backgroundColor:
                      friend.flightTagOverride === perm
                        ? 'rgba(59, 130, 246, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                    color: friend.flightTagOverride === perm ? '#60a5fa' : 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid',
                    borderColor:
                      friend.flightTagOverride === perm
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {permissionLabels[perm]}
                </button>
              ))}
            </div>
            {!friend.flightTagOverride && (
              <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', marginTop: '4px' }}>
                Using your default setting
              </div>
            )}
          </div>

          {/* Remove friend */}
          {!showRemoveConfirm ? (
            <button
              onClick={() => setShowRemoveConfirm(true)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                backgroundColor: 'transparent',
                color: '#f87171',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Remove Friend
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                Remove @{friend.username}?
              </span>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: '#f87171',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isRemoving ? 'not-allowed' : 'pointer',
                  opacity: isRemoving ? 0.7 : 1,
                }}
              >
                {isRemoving ? 'Removing...' : 'Yes'}
              </button>
              <button
                onClick={() => setShowRemoveConfirm(false)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                No
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
