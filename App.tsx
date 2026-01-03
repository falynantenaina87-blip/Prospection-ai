import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MapExplorer from './components/MapExplorer';
import ProspectList from './components/ProspectList';

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'crm'>('map');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Navbar currentView={currentView} setView={setCurrentView} />
      
      <main>
        {currentView === 'map' ? (
          <MapExplorer />
        ) : (
          <ProspectList />
        )}
      </main>
    </div>
  );
}

export default App;