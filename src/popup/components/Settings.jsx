// src/popup/components/Settings.jsx
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const InputField = ({ label, type = 'text', value, onChange, placeholder, className = "" }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, rows = "3", className = "" }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
    ></textarea>
  </div>
);

const InfoFloater = ({ title, content }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block ml-1">
      <InformationCircleIcon
        className="h-5 w-5 text-blue-400 cursor-pointer"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute left-full ml-2 w-64 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-lg z-10 text-sm text-blue-800">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p>{content}</p>
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const { settings, updateSettings } = useStore();
  const [expandedSelectors, setExpandedSelectors] = useState(false);

  const handleSelectorChange = (key, value) => {
    updateSettings({
      selectorResilience: {
        ...settings.selectorResilience,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Global Settings</h2>

      {/* API Keys Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">API Keys</h3>
        <InputField
          label="Google Sheet Link"
          type="url"
          value={settings.googleSheetLink}
          onChange={(e) => updateSettings({ googleSheetLink: e.target.value })}
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
        <InputField
          label="Google Sheet API Key"
          type="password" // Use password type for sensitivity
          value={settings.googleSheetApiKey}
          onChange={(e) => updateSettings({ googleSheetApiKey: e.target.value })}
          placeholder="AIzaSyB..."
          className="pr-8" // Space for info icon
        />
        <InfoFloater
          title="How to get Google Sheet API Key"
          content="1. Go to Google Cloud Console. 2. Create a new project. 3. Enable Google Sheets API. 4. Go to Credentials -> Create Credentials -> API Key. 5. Restrict the API key to Google Sheets API and your domain if possible."
        />

        <InputField
          label="Google Gemini API Key"
          type="password" // Use password type for sensitivity
          value={settings.geminiApiKey}
          onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
          placeholder="AIzaSyC..."
          className="pr-8" // Space for info icon
        />
        <InfoFloater
          title="How to get Google Gemini API Key"
          content="1. Go to Google AI Studio or Google Cloud Console. 2. Navigate to Gemini API or Generative AI. 3. Generate an API Key. Ensure it has access to the Gemini model."
        />
      </div>

      {/* AI Prompt Customization */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">AI Prompt Customization</h3>
        <TextAreaField
          label="/AI Cover Letter Prompt"
          value={settings.aiCoverLetterPrompt}
          onChange={(e) => updateSettings({ aiCoverLetterPrompt: e.target.value })}
          placeholder="Write a cover letter using a Humane tone based on {profile.json} and {Job Description}."
          rows="5"
        />
        <p className="text-sm text-gray-500 mb-4">
          Use <code>{`{profile.json}`}</code> and <code>{`{Job Description}`}</code> as placeholders.
        </p>

        <TextAreaField
          label="/AI Question Prompt"
          value={settings.aiQuestionPrompt}
          onChange={(e) => updateSettings({ aiQuestionPrompt: e.target.value })}
          placeholder="Answer this question: {the question} using a Humane tone based on {profile.json} and {Job Description}."
          rows="5"
        />
        <p className="text-sm text-gray-500">
          Use <code>{`{the question}`}</code>, <code>{`{profile.json}`}</code>, and <code>{`{Job Description}`}</code> as placeholders.
        </p>
      </div>

      {/* Selector Resilience Editor */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-md font-medium text-gray-800">Selector Resilience Editor</h3>
          <button
            onClick={() => setExpandedSelectors(!expandedSelectors)}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            {expandedSelectors ? (
              <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            ) : (
              <InformationCircleIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
        <InfoFloater
          title="Understanding Selectors"
          content="These are CSS or XPath selectors used by the bot to find elements on LinkedIn. If the bot stops working, LinkedIn's UI might have changed, and you may need to update these. Use Chrome DevTools (Inspect Element) to find unique attributes (e.g., aria-label, data-test-id, id) for buttons like 'Easy Apply', 'Next', 'Submit', form fields, etc. Copy 'CSS Selector' or 'Full XPath'."
        />
        <p className="text-sm text-gray-500 mt-2 mb-4">
          Advanced setting: Edit these only if the bot is failing to find elements.
        </p>
        <button
          onClick={() => setExpandedSelectors(!expandedSelectors)}
          className="mb-4 w-full text-center py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          {expandedSelectors ? 'Hide Advanced Selectors' : 'Show Advanced Selectors'}
        </button>

        {expandedSelectors && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            {Object.entries(settings.selectorResilience).map(([key, value]) => (
              <InputField
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} // Converts camelCase to "Camel Case"
                value={value}
                onChange={(e) => handleSelectorChange(key, e.target.value)}
                placeholder={`CSS/XPath for ${key}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
