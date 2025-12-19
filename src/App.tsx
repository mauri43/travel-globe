import { useState } from 'react';
import { Scene } from './components/Scene';
import { Header } from './components/Header';
import { MemoryModal } from './components/MemoryModal';
import { AdminPanel } from './components/AdminPanel';
import { AddButton } from './components/AddButton';
import { PlacesList } from './components/PlacesList';
import { TagFilter } from './components/TagFilter';
import { LandingPage } from './components/LandingPage';
import { SettingsButton } from './components/SettingsButton';
import { SettingsPanel } from './components/SettingsPanel';
import { useAuth } from './components/AuthContext';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [isSettingsOpen, setSettingsOpen] = useState(false);

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

      {/* 3D Globe Scene */}
      <Scene />

      {/* Add Button */}
      <AddButton />

      {/* Tag Filter */}
      <TagFilter />

      {/* Settings Button */}
      <SettingsButton onClick={() => setSettingsOpen(true)} />

      {/* Settings Panel */}
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Memory Modal */}
      <MemoryModal />

      {/* Admin Panel */}
      <AdminPanel />

      {/* Places List Sidebar */}
      <PlacesList />

      {/* Footer */}
      <footer className="footer">
        <p>Click on a marker to view memories • Drag to rotate the globe</p>
      </footer>
    </div>
  );
}

export default App;
