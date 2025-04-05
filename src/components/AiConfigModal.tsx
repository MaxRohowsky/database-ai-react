import React, { useState, useEffect, FormEvent } from 'react';
import { updateModelConfig } from '../services/ai';
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure AI Models</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">OpenAI Configuration</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="openai-apiKey">
                  API Key
                </label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  id="openai-apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={openAIConfig.apiKey}
                  onChange={handleOpenAIChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="openai-model">
                  Model
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Claude Configuration</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="claude-apiKey">
                  API Key
                </label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  id="claude-apiKey"
                  name="apiKey"
                  type="password"
                  placeholder="sk-ant-..."
                  value={claudeConfig.apiKey}
                  onChange={handleClaudeChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="claude-model">
                  Model
                </label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>

          {saveStatus && (
            <div
              className={`p-3 rounded-md ${
                saveStatus.success
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {saveStatus.message}
            </div>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AiConfigModal; 