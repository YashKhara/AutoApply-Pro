// src/popup/components/Header.jsx
import React from 'react';
import { Cog6ToothIcon, UserIcon, QuestionMarkCircleIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';

const Header = () => {
  const { activeSection, setActiveSection } = useStore();
  
  const navItems = [
    { id: 'bot', icon: CpuChipIcon, name: 'Bots' },
    { id: 'q', icon: QuestionMarkCircleIcon, name: 'Questions' },
    { id: 'profile', icon: UserIcon, name: 'Profile' },
  ];

  return (
    <header className="flex justify-between items-center pb-2 border-b border-gray-200">
      <h1 className="text-xl font-bold text-blue-600">AutoApply Pro</h1>
      <nav className="flex items-center space-x-4">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`p-2 rounded-full ${activeSection === item.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            title={item.name}
          >
            <item.icon className="h-6 w-6" />
          </button>
        ))}
        <button 
          onClick={() => setActiveSection('settings')}
          className={`p-2 rounded-full ${activeSection === 'settings' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          title="Settings"
        >
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
      </nav>
    </header>
  );
};

export default Header;