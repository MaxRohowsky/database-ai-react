import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Database, Trash2, Pencil, Bug } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDbConnectionStore, ConnectionDetails } from "@/store/db-connection-store";

export default function DBConnectionDialog() {
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
    const [dbDialogOpen, setDbDialogOpen] = useState(false);

    const {
        connections,
        addConnection,
        updateConnection,
        removeConnection,
        getSelectedConnection,
        setSelectedConnectionId
    } = useDbConnectionStore();

    const selectedConnection = getSelectedConnection();

    // Add debugging log for component mount
    useEffect(() => {
        console.log("DBConnectionDialog mounted");
        console.log("Saved connections:", connections);
        console.log("Selected connection:", selectedConnection);
    }, [connections, selectedConnection]);

    const form = useForm<ConnectionDetails>({
        defaultValues: {
            id: "",
            name: "",
            host: "localhost",
            port: "5432",
            database: "",
            user: "postgres",
            password: ""
        }
    });

    const handleTestConnection = async () => {
        const formData = form.getValues();
        try {
            setIsLoading(true);
            setConnectionStatus("idle");
            console.log('Testing connection with config:', formData);

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

            // Add ID if it's a new connection
            const connectionId = formData.id || `conn-${Date.now()}`;

            // Create the connection details object
            const connectionDetails: ConnectionDetails = {
                ...formData,
                id: connectionId
            };

            console.log("Saving connection:", connectionDetails);

            // Check if it's an edit or new connection
            if (connectionId && connections.some(c => c.id === connectionId)) {
                // Update existing connection
                const updatedConnection = updateConnection(connectionDetails);

                // If this is the currently selected connection, update it
                if (selectedConnection?.id === connectionId) {
                    setSelectedConnectionId(updatedConnection.id);
                }
            } else {
                // Add new connection
                const newConnection = addConnection(connectionDetails);

                // Set as current connection
                setSelectedConnectionId(newConnection.id);
            }

            // Close dialog
            setDbDialogOpen(false);

            // Reset form
            form.reset({
                id: "",
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
        console.log("Selected connection:", connection);
        setSelectedConnectionId(connection.id);
    };

    // Edit existing connection
    const handleEditConnection = (e: React.MouseEvent, connection: ConnectionDetails) => {
        e.stopPropagation();
        console.log('Editing connection:', connection);
        // Pre-fill form with connection data for editing
        form.reset(connection);
        setDbDialogOpen(true);
    };

    // Delete connection
    const handleDeleteConnection = (e: React.MouseEvent, connectionId: string) => {
        e.stopPropagation();
        console.log('Removing connection:', connectionId);
        removeConnection(connectionId);
    };

    const debugCreateTestConnection = () => {
        // Create a test connection
        const testConnection: ConnectionDetails = {
            id: `test-${Date.now()}`,
            name: "Test Database",
            host: "localhost",
            port: "5432",
            database: "postgres",
            user: "postgres",
            password: "postgres"
        };

        // Add to saved connections using the addConnection method
        const connection = addConnection(testConnection);

        // Set as selected connection
        setSelectedConnectionId(connection.id);

        // Log debug info
        console.log("Created test database connection:", connection);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                        <Database className="mr-2 h-4 w-4" />
                        <span className="max-w-[150px] truncate">
                            {selectedConnection?.name || 'Select Database'}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {connections.length > 0 ? (
                        connections.map(conn => (
                            <DropdownMenuItem
                                key={conn.id}
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => handleSelectConnection(conn)}
                            >
                                <span className="truncate mr-2">
                                    {conn.name} ({conn.database}@{conn.host})
                                </span>
                                <div className="flex items-center space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => handleEditConnection(e, conn)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => handleDeleteConnection(e, conn.id as string)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>No saved connections</DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                        className="border-t mt-2 pt-2 justify-center"
                        onSelect={(e) => {
                            e.preventDefault();
                            setDbDialogOpen(true);
                        }}
                    >
                        Connect new database
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="justify-center text-red-500"
                        onSelect={(e) => {
                            e.preventDefault();
                            debugCreateTestConnection();
                        }}
                    >
                        <Bug className="mr-2 h-4 w-4" />
                        Debug: Create Test DB
                    </DropdownMenuItem>
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
                                            <Input placeholder="5432" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="database"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Database</FormLabel>
                                        <FormControl>
                                            <Input placeholder="postgres" {...field} />
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
                                            <Input type="password" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <input type="hidden" {...form.register("id")} />
                        </form>
                    </Form>

                    <DialogFooter className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={isLoading}
                                className="mr-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Test Connection"
                                )}
                            </Button>

                            {connectionStatus === "success" && (
                                <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span className="text-xs">Connection successful</span>
                                </div>
                            )}

                            {connectionStatus === "error" && (
                                <div className="flex items-center text-red-600">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    <span className="text-xs">Connection failed</span>
                                </div>
                            )}
                        </div>

                        <Button
                            type="button"
                            onClick={handleConnectionSave}
                            disabled={isLoading}
                        >
                            Save Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
