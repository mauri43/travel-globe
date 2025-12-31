import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { Header } from './components/Header';
import { MemoryModal } from './components/MemoryModal';
import { AdminPanel } from './components/AdminPanel';
import { AddButton } from './components/AddButton';
import { PlacesList } from './components/PlacesList';
import { TagFilter } from './components/TagFilter';
import { RefreshButton } from './components/RefreshButton';
import { LandingPage } from './components/LandingPage';
import { SettingsButton } from './components/SettingsButton';
import { SettingsPanel } from './components/SettingsPanel';
import { ThemeSelector } from './components/ThemeSelector';
import { ThemeUnlockCelebration } from './components/ThemeUnlockCelebration';
import { ThemeButton } from './components/ThemeButton';
import { OnboardingTour } from './components/OnboardingTour';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './components/AuthContext';
import { SocialButton, SocialHub, UsernameSetup } from './components/social';
import { useSocialStore } from './store/socialStore';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isThemeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const [isSocialHubOpen, setSocialHubOpen] = useState(false);
  const {
    usernameSetupOpen,
    setUsernameSetupOpen,
    username,
    loadSocialProfile,
    viewUserGlobe,
    viewingProfile,
    clearViewingGlobe,
  } = useSocialStore();

  // Load social profile when user is logged in
  useEffect(() => {
    if (user) {
      loadSocialProfile();
    }
  }, [user, loadSocialProfile]);

  // Handler for viewing another user's globe
  const handleViewGlobe = async (targetUsername: string) => {
    try {
      await viewUserGlobe(targetUsername);
      setSocialHubOpen(false);
    } catch (error) {
      console.error('Failed to load globe:', error);
    }
  };

  // Handler to go back to own globe
  const handleBackToMyGlobe = () => {
    clearViewingGlobe();
  };

  // Handler for when a shared flight is added to the user's globe
  const handleFlightAdded = (cityId: string) => {
    // TODO: Trigger globe refresh and possibly focus on the new city
    console.log('Flight added:', cityId);
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner">
          <div className="spinner-ring" />
          <div className="spinner-ring" />
          <div className="spinner-ring" />
        </div>
      </div>
    );
  }

  // Show landing page if not logged in
  if (!user) {
    return <LandingPage />;
  }

  // Show globe app if logged in
  return (
    <div className="app">
      {/* Background gradient overlay */}
      <div className="background-overlay" />

      {/* Header */}
      <Header />

      {/* Viewing Banner - when viewing another user's globe */}
      {viewingProfile && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 150,
            backgroundColor: 'rgba(59, 130, 246, 0.95)',
            padding: '12px 24px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span style={{ color: 'white', fontSize: '15px' }}>
            Viewing <strong>@{viewingProfile.username}</strong>'s globe
          </span>
          <button
            onClick={handleBackToMyGlobe}
            style={{
              backgroundColor: 'white',
              color: '#3b82f6',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back to My Globe
          </button>
        </div>
      )}

      {/* 3D Globe Scene - wrapped in ErrorBoundary */}
      <ErrorBoundary
        fallback={
          <div className="canvas-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#fff', textAlign: 'center' }}>
              <p>Globe rendering error</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Reload Page
              </button>
            </div>
          </div>
        }
      >
        <Scene />
      </ErrorBoundary>

      {/* Add Button - hide when viewing someone else's globe */}
      {!viewingProfile && <AddButton />}

      {/* Tag Filter - hide when viewing someone else's globe */}
      {!viewingProfile && <TagFilter />}

      {/* Refresh Button - hide when viewing someone else's globe */}
      {!viewingProfile && <RefreshButton />}

      {/* Theme Button */}
      <ThemeButton onClick={() => setThemeSelectorOpen(true)} />

      {/* Settings Button */}
      <SettingsButton onClick={() => setSettingsOpen(true)} />

      {/* Social Button */}
      <SocialButton onClick={() => setSocialHubOpen(true)} />

      {/* Social Hub */}
      <SocialHub
        isOpen={isSocialHubOpen}
        onClose={() => setSocialHubOpen(false)}
        onViewGlobe={handleViewGlobe}
        onFlightAdded={handleFlightAdded}
      />

      {/* Username Setup Modal (standalone for Settings access) */}
      <UsernameSetup
        isOpen={usernameSetupOpen}
        onComplete={() => setUsernameSetupOpen(false)}
        onClose={() => setUsernameSetupOpen(false)}
        allowClose={!!username}
      />

      {/* Theme Selector */}
      <ThemeSelector isOpen={isThemeSelectorOpen} onClose={() => setThemeSelectorOpen(false)} />

      {/* Theme Unlock Celebration */}
      <ThemeUnlockCelebration />

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Memory Modal */}
      <MemoryModal />

      {/* Admin Panel */}
      <AdminPanel />

      {/* Places List Sidebar */}
      <PlacesList />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Footer */}
      <footer className="footer">
        <p>Click on a marker to view memories • Drag to rotate the globe</p>
      </footer>
    </div>
  );
}

export default App;
