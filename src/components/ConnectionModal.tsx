import React, { useState, useEffect, FormEvent } from 'react';
import { testConnection } from '../services/database';

interface ConnectionConfig {
  id?: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connection: ConnectionConfig) => void;
  editingConnection: ConnectionConfig | null;
  onDelete?: (id: string) => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingConnection,
  onDelete
}) => {
  const [connection, setConnection] = useState<ConnectionConfig>({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    password: ''
  });
  const [testStatus, setTestStatus] = useState<null | { success: boolean; message: string }>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes or editing connection changes
  useEffect(() => {
    if (isOpen && editingConnection) {
      setConnection(editingConnection);
    } else if (isOpen) {
      setConnection({
        name: '',
        host: 'localhost',
        port: 5432,
        database: '',
        user: '',
        password: ''
      });
    }
    setTestStatus(null);
  }, [isOpen, editingConnection]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConnection(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || '' : value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(connection);
  };

  const handleTestConnection = async () => {
    setTestStatus(null);
    setIsLoading(true);
    try {
      const config = {
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.user,
        password: connection.password
      };
      
      const result = await testConnection(config);
      
      if (result) {
        setTestStatus({ success: true, message: 'Connection successful!' });
      } else {
        setTestStatus({ success: false, message: 'Failed to connect to database' });
      }
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {editingConnection ? 'Edit Connection' : 'Connect to Database'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Connection Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              name="name"
              type="text"
              placeholder="My Database"
              value={connection.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="host">
              Host
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="host"
              name="host"
              type="text"
              placeholder="localhost"
              value={connection.host}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="port">
              Port
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="port"
              name="port"
              type="number"
              placeholder="5432"
              value={connection.port}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="database">
              Database
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="database"
              name="database"
              type="text"
              placeholder="postgres"
              value={connection.database}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="user">
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="user"
              name="user"
              type="text"
              placeholder="postgres"
              value={connection.user}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={connection.password}
              onChange={handleChange}
            />
          </div>

          {testStatus && (
            <div
              className={`p-3 mb-4 rounded-md ${
                testStatus.success
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {testStatus.message}
            </div>
          )}

          <div className="flex justify-between">
            <div>
              {editingConnection && onDelete && (
                <button
                  type="button"
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this connection?')) {
                      onDelete(editingConnection.id!);
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleTestConnection}
                disabled={isLoading}
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isLoading}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal; 