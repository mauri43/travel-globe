import { Scene } from './components/Scene';
import { Header } from './components/Header';
import { MemoryModal } from './components/MemoryModal';
import { AdminPanel } from './components/AdminPanel';
import { AddButton } from './components/AddButton';
import { PlacesList } from './components/PlacesList';
import { TagFilter } from './components/TagFilter';
import './App.css';

function App() {
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
