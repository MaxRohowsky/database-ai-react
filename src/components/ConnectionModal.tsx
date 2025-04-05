import React, { useState, useEffect, FormEvent } from 'react';
import { testConnection } from '../services/database';
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingConnection ? 'Edit Connection' : 'Connect to Database'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
                Connection Name
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                id="name"
                name="name"
                type="text"
                placeholder="My Database"
                value={connection.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="host">
                Host
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                id="host"
                name="host"
                type="text"
                placeholder="localhost"
                value={connection.host}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="port">
                Port
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                id="port"
                name="port"
                type="number"
                placeholder="5432"
                value={connection.port}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="database">
                Database
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                id="database"
                name="database"
                type="text"
                placeholder="postgres"
                value={connection.database}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="user">
                Username
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                id="user"
                name="user"
                type="text"
                placeholder="postgres"
                value={connection.user}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                Password
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={connection.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {testStatus && (
            <div
              className={`p-3 rounded-md ${
                testStatus.success
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {testStatus.message}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {editingConnection && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this connection?')) {
                      onDelete(editingConnection.id!);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isLoading}
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionModal; 