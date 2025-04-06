import { create } from 'zustand';

export interface AiModelConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
}

interface AiConfigStore {
  // State
  config: AiModelConfig | null;
  
  // Actions
  setConfig: (config: AiModelConfig | null) => void;
}

const AI_CONFIG_STORAGE_KEY = 'aiModelConfig';

export const useAiConfigStore = create<AiConfigStore>((set) => ({
  // Initial state
  config: null,
  
  // Actions
  setConfig: (config) => {
    // Validate that all required fields are provided
    if (config && (!config.provider || !config.apiKey || !config.model)) {
      console.error("Invalid AI config provided:", config);
      return;
    }
    
    set({ config });
    
    // Persist to localStorage
    if (config) {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
    }
  }
}));

// Initialize the store by loading existing config
export function initializeAiConfigStore() {
  try {
    const savedConfig = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as AiModelConfig;
        
        // Validate the config has required fields
        if (config && config.provider && config.apiKey && config.model) {
          useAiConfigStore.setState({ config });
        } else {
          console.warn("Invalid AI config found in localStorage");
        }
      } catch (parseError) {
        console.error('Failed to parse AI config JSON:', parseError);
      }
    }
  } catch (error) {
    console.error('Failed to initialize AI config store:', error);
  }
} 