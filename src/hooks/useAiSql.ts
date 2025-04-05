import { useState } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'sql' | 'result';
  content: string | Record<string, unknown>[];
  columns?: string[];
  error?: string;
}

// Use the same interface as defined in window.d.ts
type ConnectionDetails = {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
};

export interface AiConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
}

export function useAiSql() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Submit a natural language query for SQL generation
  const submitQuery = async (
    query: string, 
    aiConfig: AiConfig, 
    dbConfig?: ConnectionDetails,
    dbSchema?: string
  ) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMessageId,
      type: 'user',
      content: query
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Generate SQL with AI
      const sqlResponse = await window.electronAPI.generateSQL(aiConfig, query, dbSchema);
      
      if (sqlResponse.error) {
        throw new Error(sqlResponse.error);
      }
      
      // Add SQL message
      const sqlMessageId = (Date.now() + 1).toString();
      const sqlMessage: ChatMessage = {
        id: sqlMessageId,
        type: 'sql',
        content: sqlResponse.sqlQuery
      };
      
      setMessages(prev => [...prev, sqlMessage]);
      
      return sqlMessageId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred generating SQL');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Execute a generated SQL query
  const executeQuery = async (
    sqlMessageId: string,
    dbConfig: ConnectionDetails
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sqlMessage = messages.find(m => m.id === sqlMessageId);
      
      if (!sqlMessage || sqlMessage.type !== 'sql') {
        throw new Error('SQL message not found');
      }
      
      const query = sqlMessage.content as string;
      const result = await window.electronAPI.executeSQL(dbConfig, query);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Add result message
      const resultMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'result',
        content: result.rows,
        columns: result.columns
      };
      
      setMessages(prev => [...prev, resultMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred executing SQL');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    messages,
    isLoading,
    error,
    submitQuery,
    executeQuery
  };
} 