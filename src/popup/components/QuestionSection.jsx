// src/popup/components/QuestionSection.jsx
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const QuestionSection = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useStore();
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [newQuestionText, setNewQuestionText] = useState('');

  const handleExpand = (id) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddQuestion = () => {
    if (newQuestionText.trim()) {
      addQuestion(newQuestionText.trim());
      setNewQuestionText('');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Factual Questions to Answer</h2>

      {/* Manually Add Question */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">Add Custom Question</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            placeholder="e.g., 'What is your desired salary?'"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={handleAddQuestion}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center"
            title="Add Question"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Use this to pre-define answers for common questions. For AI-generated answers, type `/AI` in the answer field.
        </p>
      </div>

      {/* Question List Display */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-md font-medium text-gray-800 mb-3">Your Question List</h3>
        {questions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No questions added yet. Questions will also appear here dynamically when the bot encounters new ones.</p>
        )}
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="border border-gray-200 p-3 rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{q.text}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExpand(q.id)}
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    {expandedQuestions[q.id] ? <ChevronDownIcon className="h-5 w-5 text-gray-600" /> : <ChevronRightIcon className="h-5 w-5 text-gray-600" />}
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                    title="Remove Question"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {expandedQuestions[q.id] && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer / Default Value (type "/AI" for AI-generated)</label>
                  <textarea
                    value={q.answer}
                    onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
                    placeholder="Your answer or /AI"
                    rows="2"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    For checkboxes/dropdowns, provide the exact text to select (e.g., "Yes", "Option A"). For dates, use YYYY-MM-DD.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QuestionSection;
