import { create } from "zustand";

// Constants for localStorage keys
export const DB_CONNECTIONS_STORAGE_KEY = "databaseConnections";
export const ACTIVE_CONNECTION_ID_KEY = "activeConnectionId";

interface DbConfigStore {
  // State
  dbConfigs: DbConfig[];
  selectedDbConfigId: string | null;
  isLoaded: boolean;

  // Actions
  setDbConfigs: (dbConfigs: DbConfig[]) => void;
  setSelectedDbConfigId: (id: string | null) => void;
  getSelectedDbConfig: () => DbConfig | null;
  addDbConfig: (dbConfig: DbConfig) => DbConfig;
  updateDbConfig: (dbConfig: DbConfig) => DbConfig;
  removeDbConfig: (dbConfigId: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
}

export const useDbConnectionStore = create<DbConfigStore>((set, get) => ({
  // Initial state
  dbConfigs: [],
  selectedDbConfigId: null,
  isLoaded: false,

  // Actions
  setDbConfigs: (dbConfigs: DbConfig[]) => set({ dbConfigs }),

  setSelectedDbConfigId: (id: string | null) => {
    set({ selectedDbConfigId: id });

    // Persist the selection to localStorage
    if (id) {
      localStorage.setItem(ACTIVE_CONNECTION_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
    }
  },

  setIsLoaded: (isLoaded: boolean) => set({ isLoaded }),

  getSelectedDbConfig: (): DbConfig | null => {
    const { dbConfigs, selectedDbConfigId } = get();
    if (!selectedDbConfigId) return null;
    return dbConfigs.find((config) => config.id === selectedDbConfigId) || null;
  },

  addDbConfig: (dbConfig: DbConfig) => {
    set((state) => ({
      dbConfigs: [...state.dbConfigs, dbConfig],
    }));

    // Save to localStorage
    saveDbConfigsToPersistentStorage(get().dbConfigs);

    return dbConfig;
  },

  updateDbConfig: (dbConfig: DbConfig): DbConfig => {
    set((state) => ({
      dbConfigs: state.dbConfigs.map((config) =>
        config.id === dbConfig.id ? dbConfig : config,
      ),
    }));

    // Save to localStorage
    saveDbConfigsToPersistentStorage(get().dbConfigs);

    return dbConfig;
  },

  removeDbConfig: (dbConfigId: string) => {
    const { selectedDbConfigId } = get();

    set((state) => ({
      dbConfigs: state.dbConfigs.filter((config) => config.id !== dbConfigId),
    }));

    // If we're removing the selected connection, clear the selection
    if (selectedDbConfigId === dbConfigId) {
      get().setSelectedDbConfigId(null);
    }

    // Save to localStorage
    saveDbConfigsToPersistentStorage(get().dbConfigs);
  },
}));

// Helper function to save connections to localStorage
function saveDbConfigsToPersistentStorage(configs: DbConfig[]) {
  try {
    localStorage.setItem(DB_CONNECTIONS_STORAGE_KEY, JSON.stringify(configs));
  } catch (error) {
    console.error("Failed to save connections to localStorage:", error);
  }
}

// Initialize the store by loading existing connections
export function initializeDbConnectionStore() {
  try {
    // Get all connections
    const savedDbConfigsJson = localStorage.getItem(DB_CONNECTIONS_STORAGE_KEY);
    if (savedDbConfigsJson) {
      try {
        const dbConfigs = JSON.parse(savedDbConfigsJson) as DbConfig[];

        // Validate the connections
        const validDbConfigs = dbConfigs.filter((dbConfig) => {
          // Ensure all fields are present
          return (
            dbConfig.id &&
            dbConfig.name &&
            dbConfig.host &&
            dbConfig.port &&
            dbConfig.database &&
            dbConfig.user
          );
        });

        useDbConnectionStore.setState({ dbConfigs: validDbConfigs });
      } catch (parseError) {
        console.error("Failed to parse saved connections JSON:", parseError);
      }
    }

    // Get selected connection ID
    const activeDbConfigId = localStorage.getItem(ACTIVE_CONNECTION_ID_KEY);
    if (activeDbConfigId) {
      // Verify the connection exists
      const { dbConfigs } = useDbConnectionStore.getState();
      const activeDbConfigExists = dbConfigs.some(
        (dbConfig) => dbConfig.id === activeDbConfigId,
      );

      if (activeDbConfigExists) {
        useDbConnectionStore.setState({
          selectedDbConfigId: activeDbConfigId,
        });
      } else {
        // If the selected connection doesn't exist anymore, clear the active ID
        localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
      }
    }

    // Mark as loaded
    useDbConnectionStore.setState({ isLoaded: true });
  } catch (error) {
    console.error("Failed to initialize DB connection store:", error);
    useDbConnectionStore.setState({ isLoaded: true });
  }
}
