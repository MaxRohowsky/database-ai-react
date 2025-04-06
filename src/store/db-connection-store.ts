import { create } from 'zustand';

// Constants for localStorage keys
export const DB_CONNECTIONS_STORAGE_KEY = 'databaseConnections';
export const ACTIVE_CONNECTION_ID_KEY = 'activeConnectionId';

// Interface for connection details
export interface ConnectionDetails {
  id: string;
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

interface DbConnectionStore {
  // State
  connections: ConnectionDetails[];
  selectedConnectionId: string | null;
  isLoaded: boolean;
  
  // Actions
  setConnections: (connections: ConnectionDetails[]) => void;
  setSelectedConnectionId: (id: string | null) => void;
  getSelectedConnection: () => ConnectionDetails | null;
  addConnection: (connection: ConnectionDetails) => ConnectionDetails;
  updateConnection: (connection: ConnectionDetails) => ConnectionDetails;
  removeConnection: (connectionId: string) => void;
  setIsLoaded: (isLoaded: boolean) => void;
}

export const useDbConnectionStore = create<DbConnectionStore>((set, get) => ({
  // Initial state
  connections: [],
  selectedConnectionId: null,
  isLoaded: false,
  
  // Actions
  setConnections: (connections) => set({ connections }),
  
  setSelectedConnectionId: (id) => {
    set({ selectedConnectionId: id });
    
    // Persist the selection to localStorage
    if (id) {
      localStorage.setItem(ACTIVE_CONNECTION_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
    }
  },
  
  getSelectedConnection: () => {
    const { connections, selectedConnectionId } = get();
    if (!selectedConnectionId) return null;
    return connections.find(conn => conn.id === selectedConnectionId) || null;
  },
  
  addConnection: (connection) => {
    set(state => ({ 
      connections: [...state.connections, connection] 
    }));
    
    // Save to localStorage
    saveConnectionsToPersistentStorage(get().connections);
    
    return connection;
  },
  
  updateConnection: (connection) => {
    set(state => ({
      connections: state.connections.map(conn => 
        conn.id === connection.id ? connection : conn
      )
    }));
    
    // Save to localStorage
    saveConnectionsToPersistentStorage(get().connections);
    
    return connection;
  },
  
  removeConnection: (connectionId) => {
    const { selectedConnectionId } = get();
    
    set(state => ({
      connections: state.connections.filter(conn => conn.id !== connectionId)
    }));
    
    // If we're removing the selected connection, clear the selection
    if (selectedConnectionId === connectionId) {
      get().setSelectedConnectionId(null);
    }
    
    // Save to localStorage
    saveConnectionsToPersistentStorage(get().connections);
  },
  
  setIsLoaded: (isLoaded) => set({ isLoaded })
}));

// Helper function to save connections to localStorage
function saveConnectionsToPersistentStorage(connections: ConnectionDetails[]) {
  try {
    localStorage.setItem(DB_CONNECTIONS_STORAGE_KEY, JSON.stringify(connections));
  } catch (error) {
    console.error('Failed to save connections to localStorage:', error);
  }
}

// Initialize the store by loading existing connections
export function initializeDbConnectionStore() {
  try {
    // Get all connections
    const savedConnectionsJson = localStorage.getItem(DB_CONNECTIONS_STORAGE_KEY);
    if (savedConnectionsJson) {
      try {
        const connections = JSON.parse(savedConnectionsJson) as ConnectionDetails[];
        
        // Validate the connections
        const validConnections = connections.filter(conn => {
          // Ensure all fields are present
          return conn.id && conn.name && conn.host && 
                 conn.port && conn.database && conn.user;
        });
        
        useDbConnectionStore.setState({ connections: validConnections });
      } catch (parseError) {
        console.error('Failed to parse saved connections JSON:', parseError);
      }
    }
    
    // Get selected connection ID
    const activeConnectionId = localStorage.getItem(ACTIVE_CONNECTION_ID_KEY);
    if (activeConnectionId) {
      // Verify the connection exists
      const { connections } = useDbConnectionStore.getState();
      const activeConnectionExists = connections.some(conn => conn.id === activeConnectionId);
      
      if (activeConnectionExists) {
        useDbConnectionStore.setState({ selectedConnectionId: activeConnectionId });
      } else {
        // If the selected connection doesn't exist anymore, clear the active ID
        localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
      }
    }
    
    // Mark as loaded
    useDbConnectionStore.setState({ isLoaded: true });
  } catch (error) {
    console.error('Failed to initialize DB connection store:', error);
    useDbConnectionStore.setState({ isLoaded: true });
  }
} 