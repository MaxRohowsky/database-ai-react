import { create } from "zustand";

// Storage keys
const AUTO_EXECUTE_SQL_STORAGE_KEY = "autoExecuteSql";

// Default values
const DEFAULT_AUTO_EXECUTE_SQL = false;

interface SettingsStore {
  // State
  autoExecuteSql: boolean;

  // Actions
  setAutoExecuteSql: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  // Initial state
  autoExecuteSql: DEFAULT_AUTO_EXECUTE_SQL,

  // Actions
  setAutoExecuteSql: (value: boolean) => {
    set({ autoExecuteSql: value });

    // Persist to localStorage
    localStorage.setItem(AUTO_EXECUTE_SQL_STORAGE_KEY, value.toString());
  },
}));

// Function to initialize the settings store
export function initializeSettingsStore() {
  try {
    // Load auto-execute-sql preference from localStorage
    const savedAutoExecute = localStorage.getItem(AUTO_EXECUTE_SQL_STORAGE_KEY);
    if (savedAutoExecute !== null) {
      useSettingsStore.setState({
        autoExecuteSql: savedAutoExecute === "true",
      });
    }
  } catch (error) {
    console.error("Failed to initialize settings store:", error);
  }
}
