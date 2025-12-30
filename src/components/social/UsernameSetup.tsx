import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocialStore } from '../../store/socialStore';

interface UsernameSetupProps {
  isOpen: boolean;
  onComplete: (username: string) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

export function UsernameSetup({ isOpen, onComplete, onClose, allowClose = false }: UsernameSetupProps) {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    suggestion?: string;
    error?: string;
  } | null>(null);

  const { checkUsernameAvailable, setUsername: saveUsername } = useSocialStore();

  // Debounced availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailability(null);
      return;
    }

    // Validate format locally first
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setAvailability({
        available: false,
        error: 'Only letters, numbers, and underscores allowed (3-20 chars)',
      });
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailable(username);
        setAvailability(result);
      } catch {
        setAvailability({ available: false, error: 'Failed to check availability' });
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availability?.available || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await saveUsername(username);
      if (success) {
        onComplete(username);
      } else {
        setAvailability({ available: false, error: 'Failed to save username. Try again.' });
      }
    } catch {
      setAvailability({ available: false, error: 'Something went wrong. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = () => {
    if (availability?.suggestion) {
      setUsername(availability.suggestion);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={allowClose ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1a2e',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Choose Your Username
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                This is how other travelers will find you
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: '16px',
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder="username"
                    maxLength={20}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 32px',
                      fontSize: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid',
                      borderColor: availability
                        ? availability.available
                          ? '#4ade80'
                          : '#f87171'
                        : 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  {isChecking && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255, 255, 255, 0.4)',
                      }}
                    >
                      ⏳
                    </span>
                  )}
                  {!isChecking && availability && (
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {availability.available ? '✅' : '❌'}
                    </span>
                  )}
                </div>

                {/* Status message */}
                {availability && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '13px',
                      color: availability.available ? '#4ade80' : '#f87171',
                    }}
                  >
                    {availability.available ? (
                      'Username is available!'
                    ) : (
                      <>
                        {availability.error || 'Username is taken'}
                        {availability.suggestion && (
                          <span>
                            {' '}
                            - Try{' '}
                            <button
                              type="button"
                              onClick={handleSuggestionClick}
                              style={{
                                color: '#60a5fa',
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                              }}
                            >
                              @{availability.suggestion}
                            </button>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!availability?.available || isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: availability?.available ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: availability?.available ? 'pointer' : 'not-allowed',
                  opacity: isSubmitting ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </button>

              {allowClose && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '12px',
                    fontSize: '14px',
                    backgroundColor: 'transparent',
                    color: 'rgba(255, 255, 255, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Skip for now
                </button>
              )}
            </form>

            <p
              style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              You can change your username later in settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
