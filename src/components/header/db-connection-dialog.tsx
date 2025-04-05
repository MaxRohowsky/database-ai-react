import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Database } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ConnectionDetails {
    id?: string;
    name: string;
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
}

export default function DBConnectionDialog() {
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
    const [dbDialogOpen, setDbDialogOpen] = useState(false);
    const [savedConnections, setSavedConnections] = useState<ConnectionDetails[]>([]);
    const [currentConnection, setCurrentConnection] = useState<ConnectionDetails | null>(null);
    
    const form = useForm<ConnectionDetails>({
        defaultValues: {
            name: "",
            host: "localhost",
            port: "5432",
            database: "",
            user: "postgres",
            password: ""
        }
    });

    // Load saved connections on mount
    useEffect(() => {
        const loadConnections = () => {
            try {
                const saved = localStorage.getItem('databaseConnections');
                if (saved) {
                    const connections = JSON.parse(saved) as ConnectionDetails[];
                    setSavedConnections(connections);
                    
                    // Check for active connection
                    const activeId = localStorage.getItem('activeConnectionId');
                    if (activeId) {
                        const active = connections.find(c => c.id === activeId);
                        if (active) {
                            setCurrentConnection(active);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load saved connections:', error);
            }
        };
        
        loadConnections();
    }, []);

    const handleTestConnection = async () => {
        const formData = form.getValues();
        try {
            setIsLoading(true);
            setConnectionStatus("idle");
            console.log('Testing connection...');

            const connected = await window.electronAPI.testConnection(formData);

            if (connected) {
                console.log('Connection successful!');
                setConnectionStatus("success");
                return true;
            } else {
                console.log('Connection failed');
                setConnectionStatus("error");
                return false;
            }
        } catch (error) {
            console.error('Test connection error:', error);
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.log(errorMessage);
            setConnectionStatus("error");

            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectionSave = async () => {
        try {
            // Test connection first
            const isConnected = await handleTestConnection();
            if (!isConnected) {
                return; // Don't save if connection test fails
            }
            
            const formData = form.getValues();
            
            // Generate ID if this is a new connection
            const connectionDetails: ConnectionDetails = {
                ...formData,
                id: formData.id || `conn-${Date.now()}`
            };
            
            // Check if it's an edit or new connection
            let updatedConnections;
            if (connectionDetails.id && savedConnections.some(c => c.id === connectionDetails.id)) {
                // Update existing connection
                updatedConnections = savedConnections.map(conn => 
                    conn.id === connectionDetails.id ? connectionDetails : conn
                );
            } else {
                // Add new connection
                updatedConnections = [...savedConnections, connectionDetails];
            }
            
            // Save to localStorage
            localStorage.setItem('databaseConnections', JSON.stringify(updatedConnections));
            setSavedConnections(updatedConnections);
            
            // Set as current connection
            setCurrentConnection(connectionDetails);
            localStorage.setItem('activeConnectionId', connectionDetails.id || '');
            
            // Close dialog
            setDbDialogOpen(false);
            
            // Reset form
            form.reset({
                name: "",
                host: "localhost",
                port: "5432",
                database: "",
                user: "postgres",
                password: ""
            });
        } catch (error) {
            console.error('Failed to save connection:', error);
        }
    };
    
    const handleSelectConnection = (connection: ConnectionDetails) => {
        setCurrentConnection(connection);
        localStorage.setItem('activeConnectionId', connection.id || '');
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className={`flex items-center ${currentConnection ? 'text-green-500' : 'text-red-500'}`}>
                        <Database className="mr-2 h-4 w-4" />
                        <span>
                            {currentConnection 
                                ? `Database: ${currentConnection.name}`
                                : 'Database: Disconnected'}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    {savedConnections.length > 0 ? (
                        savedConnections.map(conn => (
                            <DropdownMenuItem 
                                key={conn.id}
                                onClick={() => handleSelectConnection(conn)}
                                className={currentConnection?.id === conn.id ? 'bg-gray-100' : ''}
                            >
                                {conn.name} ({conn.database}@{conn.host})
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>No saved connections</DropdownMenuItem>
                    )}
                    <div className="p-2 border-t">
                        <Button onClick={() => setDbDialogOpen(true)} variant="outline" size="sm" className="w-full">
                            Connect new database
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dbDialogOpen} onOpenChange={setDbDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Connect to Database</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Connection Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Database" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="host"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Host</FormLabel>
                                        <FormControl>
                                            <Input placeholder="localhost" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Port</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="5432" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="database"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Database Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="mydatabase" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="user"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="postgres" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="********"
                                                {...field}
                                                value={typeof field.value === 'function' ? '' : field.value}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={isLoading}
                            className={connectionStatus === "success" ? "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800" :
                                connectionStatus === "error" ? "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800" : ""}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Testing...
                                </>
                            ) : connectionStatus === "success" ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Connection Successful
                                </>
                            ) : connectionStatus === "error" ? (
                                <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Connection Failed (Click to retry)
                                </>
                            ) : (
                                "Test Connection"
                            )}
                        </Button>
                        <Button onClick={handleConnectionSave} disabled={isLoading}>Save Connection</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
