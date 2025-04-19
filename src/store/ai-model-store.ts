import { create } from "zustand";

// Storage keys
const AI_MODEL_CONFIG_STORAGE_KEY = "aiModelConfig";
const AI_MODEL_SELECTION_STORAGE_KEY = "aiModelSelection";

// Default values
const DEFAULT_AI_MODEL_CONFIG: AiModelConfig = {
  openai: { apiKey: "" },
  anthropic: { apiKey: "" },
};

const DEFAULT_AI_MODEL_SELECTION: AiModelSelection = {
  selectedModel: "",
  selectedProvider: null,
};

export const useAiModelStore = create<AiModelStore>((set) => ({
  // Initial state
  aiModelConfig: DEFAULT_AI_MODEL_CONFIG,
  aiModelSelection: DEFAULT_AI_MODEL_SELECTION,

  // Actions
  setAiModelConfig: (config) => {
    set((state) => ({
      aiModelConfig: state.aiModelConfig
        ? { ...state.aiModelConfig, ...config }
        : { ...DEFAULT_AI_MODEL_CONFIG, ...config },
    }));

    // Persist to localStorage
    const updatedAiModelConfig = useAiModelStore.getState().aiModelConfig;
    if (updatedAiModelConfig) {
      localStorage.setItem(
        AI_MODEL_CONFIG_STORAGE_KEY,
        JSON.stringify(updatedAiModelConfig),
      );
    }
  },

  setAiModelSelection: (selection) => {
    set((state) => ({
      aiModelSelection: state.aiModelSelection
        ? { ...state.aiModelSelection, ...selection }
        : { ...DEFAULT_AI_MODEL_SELECTION, ...selection },
    }));

    // Persist to localStorage
    const updatedAiModelSelection = useAiModelStore.getState().aiModelSelection;
    if (updatedAiModelSelection) {
      localStorage.setItem(
        AI_MODEL_SELECTION_STORAGE_KEY,
        JSON.stringify(updatedAiModelSelection),
      );
    }
  },

  resetConfig: () => {
    localStorage.removeItem(AI_MODEL_CONFIG_STORAGE_KEY);
    localStorage.removeItem(AI_MODEL_SELECTION_STORAGE_KEY);

    set({
      aiModelConfig: DEFAULT_AI_MODEL_CONFIG,
      aiModelSelection: DEFAULT_AI_MODEL_SELECTION,
    });
  },
}));

// Initialize the store by loading existing config
export function initializeAiConfigStore() {
  try {
    // Load provider config
    const savedProviderConfigs = localStorage.getItem(
      AI_MODEL_CONFIG_STORAGE_KEY,
    );
    if (savedProviderConfigs) {
      try {
        const config = JSON.parse(savedProviderConfigs) as AiModelConfig;
        useAiModelStore.setState({ aiModelConfig: config });
      } catch (parseError) {
        console.error("Failed to parse AI model config JSON:", parseError);
      }
    }

    // Load model selection
    const savedModelSelection = localStorage.getItem(
      AI_MODEL_SELECTION_STORAGE_KEY,
    );
    if (savedModelSelection) {
      try {
        const selection = JSON.parse(savedModelSelection) as AiModelSelection;
        useAiModelStore.setState({ aiModelSelection: selection });
      } catch (parseError) {
        console.error("Failed to parse AI model selection JSON:", parseError);
      }
    }
  } catch (error) {
    console.error("Failed to initialize AI config store:", error);
  }
}
