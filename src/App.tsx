import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import ConnectionModal from './components/ConnectionModal';
import AiConfigModal from './components/AiConfigModal';
import { connectToDatabase, getDatabaseSchema, executeQuery } from './services/database';
import { generateSqlQuery, updateModelConfig } from './services/ai';

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

interface MessageBase {
  type: string;
}

interface UserMessage extends MessageBase {
  type: 'user';
  content: string;
}

interface SqlMessage extends MessageBase {
  type: 'sql';
  content: string;
}

interface ResultMessage extends MessageBase {
  type: 'result';
  content: any;
}

interface ErrorMessage extends MessageBase {
  type: 'error';
  content: string;
}

type Message = UserMessage | SqlMessage | ResultMessage | ErrorMessage;

function App() {
  // State variables
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [connectionName, setConnectionName] = useState('');
  const [databaseSchema, setDatabaseSchema] = useState<any>(null);
  const [currentSqlQuery, setCurrentSqlQuery] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState(`chat-${Date.now()}`);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [databaseConnections, setDatabaseConnections] = useState<Connection[]>([]);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [currentAiProvider, setCurrentAiProvider] = useState('openai');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // UI state
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  
  // Load saved data on mount
  useEffect(() => {
    loadDatabaseConnections();
    loadChatHistory();
    loadAiConfigurations();
    
    // Try to connect to last used connection
    const lastConnectionId = localStorage.getItem('lastConnectionId');
    if (lastConnectionId) {
      const connection = databaseConnections.find(conn => conn.id === lastConnectionId);
      if (connection) {
        connectToDatabaseHandler(connection);
      }
    }
  }, []);
  
  // Side effect to save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatToHistory();
    }
  }, [messages]);

  // Load database connections from localStorage
  const loadDatabaseConnections = () => {
    const connections = JSON.parse(localStorage.getItem('databaseConnections') || '[]');
    setDatabaseConnections(connections);
  };

  // Load chat history from localStorage
  const loadChatHistory = () => {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    setChatHistory(history);
  };

  // Load AI configurations from localStorage
  const loadAiConfigurations = () => {
    const lastAiProvider = localStorage.getItem('current_ai_provider') || 'openai';
    setCurrentAiProvider(lastAiProvider);
    
    // Load OpenAI config
    const openaiKey = localStorage.getItem('openai_api_key');
    const openaiModel = localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
    
    if (openaiKey) {
      updateModelConfig('openai', {
        apiKey: openaiKey,
        model: openaiModel
      });
    }
    
    // Load Claude config
    const claudeKey = localStorage.getItem('claude_api_key');
    const claudeModel = localStorage.getItem('claude_model') || 'claude-3-opus-20240229';
    
    if (claudeKey) {
      updateModelConfig('claude', {
        apiKey: claudeKey,
        model: claudeModel
      });
    }
  };

  // Connect to database
  const connectToDatabaseHandler = async (connection: Connection) => {
    try {
      displayStatusMessage(`Connecting to ${connection.name}...`);
      
      const connected = await connectToDatabase({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        password: connection.password
      });
      
      if (connected) {
        // Update state
        setConnectionStatus(true);
        setConnectionName(connection.name);
        setCurrentConnectionId(connection.id);
        
        // Save last connection ID
        localStorage.setItem('lastConnectionId', connection.id);
        
        // Fetch schema
        const schema = await getDatabaseSchema();
        setDatabaseSchema(schema);
        
        if (schema && Object.keys(schema).length > 0) {
          displayStatusMessage(`Connected to ${connection.name}`);
        } else {
          displayStatusMessage(`Connected to ${connection.name} but no tables found`, true);
        }
      } else {
        throw new Error('Failed to connect to database');
      }
    } catch (error) {
      console.error('Connection error:', error);
      displayStatusMessage(`Error connecting to ${connection.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      setConnectionStatus(false);
    }
  };

  // Display status message (implement this with a toast/notification system)
  const displayStatusMessage = (message: string, isError = false) => {
    console.log(message, isError ? 'error' : 'success');
    // TODO: Add a toast notification system
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentSqlQuery(null);
    setCurrentChatId(`chat-${Date.now()}`);
    displayStatusMessage('New chat started');
  };

  // Generate SQL from natural language
  const generateSql = async (naturalLanguage: string) => {
    if (!naturalLanguage || !databaseSchema) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: naturalLanguage
    }]);
    
    try {
      displayStatusMessage(`Generating SQL with ${currentAiProvider}...`);
      
      const sql = await generateSqlQuery(
        naturalLanguage, 
        databaseSchema, 
        currentAiProvider
      );
      
      setCurrentSqlQuery(sql);
      
      // Add SQL message
      setMessages(prev => [...prev, {
        type: 'sql',
        content: sql
      }]);
      
      displayStatusMessage('SQL generated successfully');
    } catch (error) {
      console.error('SQL generation error:', error);
      displayStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      
      // Add error message
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Error generating SQL: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    }
  };

  // Execute the SQL query
  const executeQueryHandler = async (sql: string = currentSqlQuery || '') => {
    if (!sql) return;
    
    try {
      displayStatusMessage('Executing query...');
      
      const result = await executeQuery(sql);
      
      // Add result message
      setMessages(prev => [...prev, {
        type: 'result',
        content: result
      }]);
      
      displayStatusMessage('Query executed successfully');
    } catch (error) {
      console.error('Query execution error:', error);
      displayStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
      
      // Add error message
      setMessages(prev => [...prev, {
        type: 'error',
        content: `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    }
  };

  // Save chat to history
  const saveChatToHistory = () => {
    // Get the title from the first user message
    const firstUserMessage = messages.find(msg => msg.type === 'user') as UserMessage;
    if (!firstUserMessage) return;
    
    const title = firstUserMessage.content.length > 30 
      ? firstUserMessage.content.substring(0, 30) + '...' 
      : firstUserMessage.content;
    
    const chatEntry: ChatHistoryItem = {
      id: currentChatId,
      title,
      timestamp: new Date().toISOString(),
      messages: messages
    };
    
    const existingHistory = [...chatHistory];
    const existingIndex = existingHistory.findIndex(chat => chat.id === currentChatId);
    
    if (existingIndex !== -1) {
      existingHistory[existingIndex] = chatEntry;
    } else {
      existingHistory.push(chatEntry);
    }
    
    setChatHistory(existingHistory);
    localStorage.setItem('chatHistory', JSON.stringify(existingHistory));
  };

  // Handle connection modal open
  const openConnectionModal = (connection: Connection | null = null) => {
    setEditingConnection(connection);
    setShowConnectionModal(true);
  };

  // Handle saving connection
  const saveConnection = (connection: Connection) => {
    const isEditing = !!connection.id;
    let updatedConnections: Connection[];
    
    if (isEditing) {
      updatedConnections = databaseConnections.map(conn => 
        conn.id === connection.id ? connection : conn
      );
    } else {
      connection.id = `conn-${Date.now()}`;
      updatedConnections = [...databaseConnections, connection];
    }
    
    setDatabaseConnections(updatedConnections);
    localStorage.setItem('databaseConnections', JSON.stringify(updatedConnections));
    setShowConnectionModal(false);
    
    // If we're editing the current connection, reconnect
    if (isEditing && connection.id === currentConnectionId) {
      connectToDatabaseHandler(connection);
    }
  };

  // Handle deleting connection
  const deleteConnection = (id: string) => {
    const updatedConnections = databaseConnections.filter(conn => conn.id !== id);
    setDatabaseConnections(updatedConnections);
    localStorage.setItem('databaseConnections', JSON.stringify(updatedConnections));
    setShowConnectionModal(false);
    
    // If deleting current connection, disconnect
    if (id === currentConnectionId) {
      setConnectionStatus(false);
      setConnectionName('');
      setCurrentConnectionId(null);
      localStorage.removeItem('lastConnectionId');
      setDatabaseSchema(null);
    }
  };

  // Load a chat from history
  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    setCurrentChatId(chatId);
    setMessages(chat.messages);
    
    // Find the latest SQL query if any
    const sqlMessages = chat.messages.filter(msg => msg.type === 'sql') as SqlMessage[];
    if (sqlMessages.length > 0) {
      setCurrentSqlQuery(sqlMessages[sqlMessages.length - 1].content);
    }
  };

  // Delete a chat from history
  const deleteChat = (chatId: string) => {
    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    
    if (chatId === currentChatId) {
      startNewChat();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header 
        connectionStatus={connectionStatus}
        connectionName={connectionName}
        currentAiProvider={currentAiProvider}
        onNewConnection={() => openConnectionModal(null)}
        onConfigureAi={() => setShowAiConfigModal(true)}
        onSelectAiProvider={(provider) => {
          setCurrentAiProvider(provider);
          localStorage.setItem('current_ai_provider', provider);
        }}
      />
      
      <div className="flex flex-grow overflow-hidden">
        <Sidebar 
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onLoadChat={loadChat}
          onDeleteChat={deleteChat}
        />
        
        <div className="flex flex-col flex-grow overflow-hidden">
          <ChatWindow 
            messages={messages}
            onExecuteQuery={executeQueryHandler}
          />
          
          <InputArea 
            disabled={!connectionStatus}
            onSubmit={generateSql}
          />
        </div>
      </div>
      
      <ConnectionModal 
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onSave={saveConnection}
        editingConnection={editingConnection}
        onDelete={deleteConnection}
      />
      
      <AiConfigModal 
        isOpen={showAiConfigModal}
        onClose={() => setShowAiConfigModal(false)}
      />
    </div>
  );
}

export default App;