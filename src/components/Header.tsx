import React, { useState } from 'react';
import { Button } from './ui/button';

interface HeaderProps {
  connectionStatus: boolean;
  connectionName: string;
  currentAiProvider: string;
  onNewConnection: () => void;
  onConfigureAi: () => void;
  onSelectAiProvider: (provider: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  connectionName,
  currentAiProvider,
  onNewConnection,
  onConfigureAi,
  onSelectAiProvider
}) => {
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [showAiDropdown, setShowAiDropdown] = useState(false);

  return (
    <header className=" shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button 
        variant="default"
        className="bg-gray-200 text-gray-800 hover:bg-gray-300"
        >New Chat</Button>

        <h1 className="text-xl font-bold mr-4">Database AI</h1>
        <div className="relative mr-4">
          <button
            className={`px-3 py-1 rounded-md flex items-center ${
              connectionStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
            onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
          >
            <span>
              Database: {connectionStatus ? `Connected (${connectionName})` : 'Disconnected'}
            </span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showConnectionDropdown && (
            <div className="absolute mt-2 w-56 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onNewConnection();
                    setShowConnectionDropdown(false);
                  }}
                >
                  Connect to Database
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            className="px-3 py-1 rounded-md bg-purple-100 text-purple-800 flex items-center"
            onClick={() => setShowAiDropdown(!showAiDropdown)}
          >
            <span>
              AI Model: {currentAiProvider === 'openai' ? 'OpenAI' : 'Claude'}
            </span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAiDropdown && (
            <div className="absolute mt-2 w-56 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onSelectAiProvider('openai');
                    setShowAiDropdown(false);
                  }}
                >
                  OpenAI
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onSelectAiProvider('claude');
                    setShowAiDropdown(false);
                  }}
                >
                  Claude
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    onConfigureAi();
                    setShowAiDropdown(false);
                  }}
                >
                  Configure AI Models
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 