// src/popup/components/BotSection.jsx
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid'; // Added TrashIcon

const BotSection = () => {
  const { bots, addBot, updateBot, toggleBot, deleteBot } = useStore(); // Added deleteBot
  const [expandedBots, setExpandedBots] = useState({});

  const handleExpand = (id) => {
    setExpandedBots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Bots</h2>
        <button onClick={addBot} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600" title="Add New Bot">
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      <ul className="space-y-2">
        {bots.map((bot, index) => (
          <li key={bot.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2 font-medium">{index + 1}.</span>
                <input
                  type="text"
                  value={bot.botName}
                  onChange={(e) => updateBot(bot.id, { botName: e.target.value })}
                  className="font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                />
              </div>
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={bot.isOn} onChange={() => toggleBot(bot.id)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <button
                  onClick={() => handleExpand(bot.id)}
                  className="p-1 rounded-full hover:bg-gray-200"
                  title={expandedBots[bot.id] ? "Collapse" : "Expand"}
                >
                  {expandedBots[bot.id] ? <ChevronDownIcon className="h-5 w-5 text-gray-600" /> : <ChevronRightIcon className="h-5 w-5 text-gray-600" />}
                </button>
                <button
                  onClick={() => deleteBot(bot.id)} // Added delete button
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                  title="Delete Bot"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            {expandedBots[bot.id] && (
              <div className="mt-4 space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600">LinkedIn Job Search URL</label>
                  <input
                    type="text"
                    placeholder="https://www.linkedin.com/jobs/search/?keywords=React"
                    value={bot.linkedInUrl}
                    onChange={(e) => updateBot(bot.id, { linkedInUrl: e.target.value })}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </li>
        ))}
        {bots.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No bots configured yet. Click the '+' button to add one!</p>
        )}
      </ul>
    </div>
  );
};

export default BotSection;