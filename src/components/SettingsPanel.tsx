import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { getUserProfile, updateTrustedEmails } from '../services/api';
import { useStore } from '../store';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user, logout } = useAuth();
  const startTour = useStore((state) => state.startTour);
  const [trustedEmails, setTrustedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getUserProfile();
      setTrustedEmails(profile.trustedEmails || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
      // If profile doesn't exist yet, start with user's email
      if (user?.email) {
        setTrustedEmails([user.email]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (trustedEmails.includes(newEmail.trim().toLowerCase())) {
      setError('This email is already in your trusted list');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const updatedEmails = [...trustedEmails, newEmail.trim().toLowerCase()];
      await updateTrustedEmails(updatedEmails);
      setTrustedEmails(updatedEmails);
      setNewEmail('');
      setSuccessMessage('Email added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Add email error:', err);
      setError(err.message || 'Failed to add email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    // Don't allow removing the last email
    if (trustedEmails.length <= 1) {
      setError('You must have at least one trusted email');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const updatedEmails = trustedEmails.filter(e => e !== emailToRemove);
      await updateTrustedEmails(updatedEmails);
      setTrustedEmails(updatedEmails);
      setSuccessMessage('Email removed');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Remove email error:', err);
      setError(err.message || 'Failed to remove email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="settings-panel"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="settings-close" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="settings-content">
              {/* Account Section */}
              <div className="settings-section">
                <h3>Account</h3>
                <div className="settings-account-info">
                  <div className="account-email">
                    <span className="label">Signed in as</span>
                    <span className="email">{user?.email}</span>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                  <button className="tour-btn" onClick={() => { startTour(); onClose(); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    Take Tour
                  </button>
                </div>
              </div>

              {/* Trusted Emails Section */}
              <div className="settings-section">
                <h3>Trusted Emails</h3>
                <p className="settings-description">
                  Emails you forward flight confirmations from. When you forward to{' '}
                  <span className="highlight">trips@mytravelglobe.org</span>, we'll match the sender to your account.
                </p>

                {isLoading ? (
                  <div className="settings-loading">Loading...</div>
                ) : (
                  <>
                    <div className="trusted-emails-list">
                      {trustedEmails.map((email) => (
                        <div key={email} className="trusted-email-item">
                          <span className="email-text">{email}</span>
                          <button
                            className="remove-email-btn"
                            onClick={() => handleRemoveEmail(email)}
                            disabled={isSaving || trustedEmails.length <= 1}
                            title={trustedEmails.length <= 1 ? 'Cannot remove last email' : 'Remove email'}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="add-email-form">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                        placeholder="Add another email..."
                        disabled={isSaving}
                      />
                      <button
                        className="add-email-btn"
                        onClick={handleAddEmail}
                        disabled={isSaving || !newEmail.trim()}
                      >
                        {isSaving ? 'Adding...' : 'Add'}
                      </button>
                    </div>

                    {error && <div className="settings-error">{error}</div>}
                    {successMessage && <div className="settings-success">{successMessage}</div>}
                  </>
                )}
              </div>

              {/* How It Works Section */}
              <div className="settings-section">
                <h3>How It Works</h3>
                <div className="how-it-works">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <strong>Receive a flight confirmation</strong>
                      <p>Get your booking email from the airline</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <strong>Forward it to us</strong>
                      <p>Send to trips@mytravelglobe.org</p>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <strong>Watch your globe light up</strong>
                      <p>We'll extract the trip and add it automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
