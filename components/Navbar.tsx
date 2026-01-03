import React from 'react';

interface NavbarProps {
    currentView: 'map' | 'crm';
    setView: (view: 'map' | 'crm') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
    return (
        <nav className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    M
                </div>
                <span className="text-lg font-semibold tracking-tight">Maps Prospector AI</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setView('map')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'map' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    Exploration
                </button>
                <button
                    onClick={() => setView('crm')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'crm' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                >
                    CRM
                </button>
            </div>
        </nav>
    );
};

export default Navbar;