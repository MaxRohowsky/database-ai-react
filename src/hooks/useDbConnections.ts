// useConnectionManager.ts
import { useState, useEffect } from 'react';

// Constants for localStorage keys
export const DB_CONNECTIONS_STORAGE_KEY = 'databaseConnections';

// Interface for connection details
export interface ConnectionDetails {
  id: string; // Make id required
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export function useDbConnections() {
  const [savedConnections, setSavedConnections] = useState<ConnectionDetails[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load connections from localStorage on mount
  useEffect(() => {
    const loadConnections = () => {
      try {
        console.log("Loading database connections from localStorage...");
        const saved = localStorage.getItem(DB_CONNECTIONS_STORAGE_KEY);
        
        if (saved) {
          try {
            const connections = JSON.parse(saved) as ConnectionDetails[];
            
            // Validate the connections
            const validConnections = connections.filter(conn => {
              // Ensure all fields are present
              const hasAllFields = conn.id && conn.name && conn.host && 
                                   conn.port && conn.database && conn.user;
              
              if (!hasAllFields) {
                console.warn("Found invalid connection, filtering out:", conn);
              }
              
              return hasAllFields;
            });
            
            console.log(`Loaded ${validConnections.length} database connections from localStorage`);
            setSavedConnections(validConnections);
          } catch (parseError) {
            console.error('Failed to parse saved connections JSON:', parseError);
            // Initialize with empty array on parse error
            setSavedConnections([]);
          }
        } else {
          console.log("No saved database connections found in localStorage");
          setSavedConnections([]);
        }
      } catch (error) {
        console.error('Failed to load saved connections:', error);
        setSavedConnections([]);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadConnections();
  }, []);

  // Save connections to localStorage whenever they change
  useEffect(() => {
    // Skip saving during initial load
    if (!isLoaded) return;
    
    try {
      console.log(`Saving ${savedConnections.length} database connections to localStorage`);
      localStorage.setItem(DB_CONNECTIONS_STORAGE_KEY, JSON.stringify(savedConnections));
    } catch (error) {
      console.error('Failed to save connections to localStorage:', error);
    }
  }, [savedConnections, isLoaded]);

  // Add a connection
  const addConnection = (connection: ConnectionDetails) => {
    console.log("Adding connection:", connection.name);
    setSavedConnections(prev => [...prev, connection]);
    return connection;
  };

  // Update a connection
  const updateConnection = (connection: ConnectionDetails) => {
    console.log("Updating connection:", connection.name);
    setSavedConnections(prev => 
      prev.map(conn => conn.id === connection.id ? connection : conn)
    );
    return connection;
  };

  // Remove a connection
  const removeConnection = (connectionId: string) => {
    console.log("Removing connection:", connectionId);
    setSavedConnections(prev => prev.filter(conn => conn.id !== connectionId));
  };
  
  return {
    savedConnections,
    addConnection,
    updateConnection,
    removeConnection,
    isLoaded
  };
}