import { useState, useEffect } from 'react';

export interface AiModelConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
}

const AI_CONFIG_STORAGE_KEY = 'aiModelConfig';

export function useAiModelConfig() {
  const [aiConfig, setAiConfigState] = useState<AiModelConfig | null>(null);

  // Load AI config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        // Validate the config has required fields
        if (config && config.provider && config.apiKey && config.model) {
          console.log("Loaded AI config:", JSON.stringify({
            provider: config.provider,
            model: config.model,
            apiKeyLength: config.apiKey.length
          }));
          setAiConfigState(config);
        } else {
          console.warn("Invalid AI config found in localStorage", config);
        }
      }
    } catch (error) {
      console.error('Failed to load AI model configuration:', error);
    }
  }, []);

  // Save AI config to localStorage whenever it changes
  const setAiConfig = (config: AiModelConfig | null) => {
    console.log("Setting AI config:", config ? JSON.stringify({
      provider: config.provider,
      model: config.model,
      apiKeyLength: config.apiKey ? config.apiKey.length : 0
    }) : "null");
    
    // Validate that all required fields are provided
    if (config && (!config.provider || !config.apiKey || !config.model)) {
      console.error("Invalid AI config provided:", config);
      return;
    }
    
    setAiConfigState(config);
    
    if (config) {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
    }
  };

  return {
    aiConfig,
    setAiConfig
  };
} 