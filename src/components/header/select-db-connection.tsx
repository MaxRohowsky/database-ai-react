import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Database, Trash2, Pencil } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDbConnections } from "@/hooks/useDbConnections";
import { removeConnection } from "@/lib/removeConnection";
import { useSelectedDbConnection } from "@/hooks/useSelectedDbConnection";

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
    const { savedConnections, setSavedConnections } = useDbConnections();
    const { selectedConnection, setSelectedConnection } = useSelectedDbConnection();

    // Add debugging log for component mount
    useEffect(() => {
        console.log("DBConnectionDialog mounted");
        console.log("Saved connections:", savedConnections);
        console.log("Selected connection:", selectedConnection);
    }, [savedConnections, selectedConnection]);

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

            // Generate ID if this is a new connection
            const connectionDetails: ConnectionDetails = {
                ...formData,
                id: formData.id || `conn-${Date.now()}`
            };

            console.log("Saving connection:", connectionDetails);

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
            setSelectedConnection(connectionDetails);

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
        console.log("Selected connection:", connection);
        setSelectedConnection(connection);
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
        
        // If deleting the selected connection, clear it
        if (selectedConnection?.id === connectionId) {
            setSelectedConnection(null);
        }
        
        removeConnection(connectionId, savedConnections, setSavedConnections);
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
                    {savedConnections.length > 0 ? (
                        savedConnections.map(conn => (
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
