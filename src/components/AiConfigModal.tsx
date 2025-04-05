import React, { useState, useEffect, FormEvent } from 'react';
import { updateModelConfig } from '../services/ai';

interface ModelConfig {
  apiKey: string;
  model: string;
}

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiConfigModal: React.FC<AiConfigModalProps> = ({ isOpen, onClose }) => {
  const [openAIConfig, setOpenAIConfig] = useState<ModelConfig>({
    apiKey: '',
    model: 'gpt-3.5-turbo'
  });
  
  const [claudeConfig, setClaudeConfig] = useState<ModelConfig>({
    apiKey: '',
    model: 'claude-3-opus-20240229'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | { success: boolean; message: string }>(null);

  // Load existing configurations from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedOpenAIKey = localStorage.getItem('openai_api_key') || '';
      const savedOpenAIModel = localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
      const savedClaudeKey = localStorage.getItem('claude_api_key') || '';
      const savedClaudeModel = localStorage.getItem('claude_model') || 'claude-3-opus-20240229';
      
      setOpenAIConfig({
        apiKey: savedOpenAIKey,
        model: savedOpenAIModel
      });
      
      setClaudeConfig({
        apiKey: savedClaudeKey,
        model: savedClaudeModel
      });
      
      setSaveStatus(null);
    }
  }, [isOpen]);

  const handleOpenAIChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOpenAIConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleClaudeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClaudeConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      // Only update OpenAI if key is provided
      if (openAIConfig.apiKey) {
        await updateModelConfig('openai', openAIConfig);
        localStorage.setItem('openai_api_key', openAIConfig.apiKey);
        localStorage.setItem('openai_model', openAIConfig.model);
      }
      
      // Only update Claude if key is provided
      if (claudeConfig.apiKey) {
        await updateModelConfig('claude', claudeConfig);
        localStorage.setItem('claude_api_key', claudeConfig.apiKey);
        localStorage.setItem('claude_model', claudeConfig.model);
      }
      
      setSaveStatus({ success: true, message: 'AI configurations saved successfully' });
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      setSaveStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save AI configuration' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Configure AI Models</h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">OpenAI Configuration</h3>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="openai-apiKey">
                API Key
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="openai-apiKey"
                name="apiKey"
                type="password"
                placeholder="sk-..."
                value={openAIConfig.apiKey}
                onChange={handleOpenAIChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="openai-model">
                Model
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="openai-model"
                name="model"
                value={openAIConfig.model}
                onChange={handleOpenAIChange}
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Claude Configuration</h3>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claude-apiKey">
                API Key
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="claude-apiKey"
                name="apiKey"
                type="password"
                placeholder="sk-ant-..."
                value={claudeConfig.apiKey}
                onChange={handleClaudeChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="claude-model">
                Model
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="claude-model"
                name="model"
                value={claudeConfig.model}
                onChange={handleClaudeChange}
              >
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </select>
            </div>
          </div>

          {saveStatus && (
            <div
              className={`p-3 mb-4 rounded-md ${
                saveStatus.success
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {saveStatus.message}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiConfigModal; 