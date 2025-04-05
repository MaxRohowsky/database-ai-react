// useConnectionManager.ts
import { useState, useEffect } from 'react';
import { ConnectionDetails } from './useDbConnections';

const ACTIVE_CONNECTION_ID_KEY = 'activeConnectionId';

export function useSelectedDbConnection() {
  const [selectedConnection, setSelectedConnectionState] = useState<ConnectionDetails | null>(null);

  useEffect(() => {
    const loadSelectedConnection = () => {
      try {
        // Get active connection ID
        const activeConnectionId = localStorage.getItem(ACTIVE_CONNECTION_ID_KEY);
        if (!activeConnectionId) return;
        
        // Get all connections
        const savedConnectionsJson = localStorage.getItem('databaseConnections');
        if (!savedConnectionsJson) return;
        
        const savedConnections = JSON.parse(savedConnectionsJson) as ConnectionDetails[];
        
        // Find the active connection by ID
        const activeConnection = savedConnections.find(conn => conn.id === activeConnectionId);
        if (activeConnection) {
          setSelectedConnectionState(activeConnection);
        }
      } catch (error) {
        console.error('Failed to load selected database connection:', error);
      }
    };
    
    loadSelectedConnection();
  }, []);

  const setSelectedConnection = (connection: ConnectionDetails | null) => {
    setSelectedConnectionState(connection);
    
    if (connection && connection.id) {
      localStorage.setItem(ACTIVE_CONNECTION_ID_KEY, connection.id);
    } else {
      localStorage.removeItem(ACTIVE_CONNECTION_ID_KEY);
    }
  };

  return {
    selectedConnection,
    setSelectedConnection
  };
}