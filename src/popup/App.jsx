// src/popup/App.jsx
import React, { useEffect } from 'react';
import Header from './components/Header';
import BotSection from './components/BotSection';
import QuestionSection from './components/QuestionSection'; // Added import
import ProfileSection from './components/ProfileSection';   // Added import
import Settings from './components/Settings';               // Added import
import { useStore } from './store/useStore';

function App() {
  const { activeSection, loadData } = useStore();

  useEffect(() => {
    loadData();
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'bot': return <BotSection />;
      case 'q': return <QuestionSection />;
      case 'profile': return <ProfileSection />;
      case 'settings': return <Settings />;
      default: return <BotSection />;
    }
  };

  return (
    <div className="bg-gray-50 text-gray-800 p-4 font-sans">
      <Header />
      <main className="mt-4">
        {renderSection()}
      </main>
    </div>
  );
}

export default App;