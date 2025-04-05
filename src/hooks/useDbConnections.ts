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

export function useDbConnections() {
  const [savedConnections, setSavedConnections] = useState<ConnectionDetails[]>([]);

  useEffect(() => {
    const loadConnections = () => {
        
      try {
        const saved = localStorage.getItem('databaseConnections');
        if (saved) {
          const connections = JSON.parse(saved) as ConnectionDetails[];
          setSavedConnections(connections);
          console.log(connections);
        }
      } catch (error) {
        console.error('Failed to load saved connections:', error);
      }
    };
    
    loadConnections();
  }, []);

  useEffect(() => {
    localStorage.setItem('databaseConnections', JSON.stringify(savedConnections));
  }, [savedConnections]);

  
  return {
    savedConnections,
    setSavedConnections
  };
}