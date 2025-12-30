import { useState } from 'react';
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
import { SocialButton, SocialHub } from './components/social';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isThemeSelectorOpen, setThemeSelectorOpen] = useState(false);
  const [isSocialHubOpen, setSocialHubOpen] = useState(false);

  // Handler for viewing another user's globe
  const handleViewGlobe = (username: string) => {
    // TODO: Implement public globe viewing
    console.log('View globe for:', username);
    setSocialHubOpen(false);
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

      {/* Add Button */}
      <AddButton />

      {/* Tag Filter */}
      <TagFilter />

      {/* Refresh Button */}
      <RefreshButton />

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
