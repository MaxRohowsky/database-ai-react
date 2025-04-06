// useConnectionManager.ts
import { useState, useEffect } from 'react';
import { ConnectionDetails, DB_CONNECTIONS_STORAGE_KEY } from './useDbConnections';

const ACTIVE_CONNECTION_ID_KEY = 'activeConnectionId';

export function useSelectedDbConnection() {
  const [selectedConnection, setSelectedConnectionState] = useState<ConnectionDetails | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load selected connection from localStorage on mount
  useEffect(() => {
    const loadSelectedConnection = () => {
      try {
        console.log("Loading selected database connection...");
        
        // Get active connection ID
        const activeConnectionId = localStorage.getItem(ACTIVE_CONNECTION_ID_KEY);
        console.log("Active connection ID from localStorage:", activeConnectionId);
        
        if (!activeConnectionId) {
          console.log("No active connection ID found in localStorage");
          setIsLoaded(true);
          return;
        }
        
        // Get all connections
        const savedConnectionsJson = localStorage.getItem(DB_CONNECTIONS_STORAGE_KEY);
        if (!savedConnectionsJson) {
          console.log("No saved connections found in localStorage");
          setIsLoaded(true);
          return;
        }
        
        try {
          const savedConnections = JSON.parse(savedConnectionsJson) as ConnectionDetails[];
          console.log(`Found ${savedConnections.length} saved connections`);
          
          // Find the active connection by ID
          const activeConnection = savedConnections.find(conn => conn.id === activeConnectionId);
          if (activeConnection) {
            console.log("Setting active connection:", activeConnection.name);
            setSelectedConnectionState(activeConnection);
          } else {
            console.log(`Active connection with ID ${activeConnectionId} not found in saved connections`);
            // If the selected connection doesn't exist anymore, clear the active ID
            localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
          }
        } catch (parseError) {
          console.error('Failed to parse saved connections JSON:', parseError);
          localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
        }
      } catch (error) {
        console.error('Failed to load selected database connection:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadSelectedConnection();
    
    // Add event listener for localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === DB_CONNECTIONS_STORAGE_KEY || event.key === ACTIVE_CONNECTION_ID_KEY) {
        console.log("Storage change detected, reloading connection...");
        loadSelectedConnection();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setSelectedConnection = (connection: ConnectionDetails | null) => {
    console.log("Setting selected connection:", connection ? connection.name : 'null');
    
    setSelectedConnectionState(connection);
    
    if (connection && connection.id) {
      localStorage.setItem(ACTIVE_CONNECTION_ID_KEY, connection.id);
      console.log(`Saved connection ID ${connection.id} to localStorage`);
    } else {
      localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
      console.log("Cleared active connection ID from localStorage");
    }
  };

  return {
    selectedConnection,
    setSelectedConnection,
    isLoaded
  };
}