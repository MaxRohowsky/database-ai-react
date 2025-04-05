// useConnectionManager.ts
import { useState, useEffect } from 'react';

// Interface for connection details
export interface ConnectionDetails {
  id?: string;
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export function useSelectedDbConnection() {
  const [selectedConnection, setSelectedConnection] = useState<ConnectionDetails | null>(null);

  useEffect(() => {
    const loadConnection = () => {
        
      try {
        const saved = localStorage.getItem('activeConnectionId');
        if (saved) {
          const connection = JSON.parse(saved) as ConnectionDetails;
          setSelectedConnection(connection);
          console.log(connection);
        }
      } catch (error) {
        console.error('Failed to load saved connections:', error);
      }
    };
    
    loadConnection();
  }, []);

  useEffect(() => {
    localStorage.setItem('activeConnectionId', JSON.stringify(selectedConnection));
  }, [selectedConnection]);

  
  return {
    selectedConnection,
    setSelectedConnection
  };
}