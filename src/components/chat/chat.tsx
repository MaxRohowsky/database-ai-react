import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Textarea } from "../ui/textarea"
import { useAppContext } from "@/context-provider"
import { AlertCircle, Send, Play, Loader2, Edit } from "lucide-react"
import { useAiModelConfig } from "@/hooks/useAiModelConfig"
import { useSelectedDbConnection } from "@/hooks/useSelectedDbConnection"

export default function Chat() {
    const { 
        currentChatId, 
        getCurrentChat, 
        addMessageToCurrentChat,
        createNewChat,
        updateMessage
    } = useAppContext();
    
    const { aiConfig } = useAiModelConfig();
    const { selectedConnection: dbConfig } = useSelectedDbConnection();
    
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [editingSqlId, setEditingSqlId] = useState<string | null>(null);
    const [editedSqlContent, setEditedSqlContent] = useState<string>("");
    
    // Get the current chat's messages
    const currentChat = getCurrentChat();
    const messages = currentChat?.messages || [];
    
    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    // Function to start editing SQL
    const startEditingSql = (messageId: string, content: string) => {
        setEditingSqlId(messageId);
        setEditedSqlContent(content);
    };

    // Function to save edited SQL
    const saveEditedSql = (messageId: string) => {
        if (!editedSqlContent.trim()) return;
        
        // Update the message using the context function
        updateMessage(messageId, {
            content: editedSqlContent
        });
        
        // End editing mode
        setEditingSqlId(null);
    };
    
    // Function to handle form submission
    const handleSubmit = async () => {
        if (!inputValue.trim()) return;
        
        if (!aiConfig) {
            setError("Please configure an OpenAI API key first.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        // Add user message to context
        addMessageToCurrentChat({
            type: 'user',
            content: inputValue
        });
        
        const userQuery = inputValue.trim();
        setInputValue("");
        
        try {
            // Get database schema if a connection is configured
            let dbSchema: string | undefined = undefined;
            if (dbConfig) {
                try {
                    console.log("Fetching database schema for context...");
                    const schemaResult = await window.electronAPI.fetchDbSchema(dbConfig);
                    if (schemaResult && !schemaResult.error) {
                        dbSchema = schemaResult.schema;
                        console.log("Successfully fetched database schema");
                    } else if (schemaResult.error) {
                        console.warn("Failed to fetch schema:", schemaResult.error);
                    }
                } catch (schemaErr) {
                    console.warn("Error fetching database schema:", schemaErr);
                    // Continue without schema, don't block SQL generation
                }
            }
            
            console.log("Generating SQL with config:", JSON.stringify({
                provider: aiConfig.provider,
                model: aiConfig.model,
                apiKeyLength: aiConfig.apiKey ? aiConfig.apiKey.length : 0,
                hasSchema: !!dbSchema
            }));
            
            // Generate SQL with AI
            const sqlResponse = await window.electronAPI.generateSQL(
                aiConfig, 
                userQuery,
                dbSchema
            );
            
            console.log("SQL Response:", JSON.stringify(sqlResponse));
            
            if (sqlResponse.error) {
                throw new Error(sqlResponse.error);
            }
            
            if (!sqlResponse.sqlQuery) {
                throw new Error("No SQL was generated. Please try again.");
            }
            
            // Add SQL message to context
            addMessageToCurrentChat({
                type: 'sql',
                content: sqlResponse.sqlQuery
            });
        } catch (err) {
            console.error("SQL generation error:", err);
            setError(err instanceof Error ? err.message : 'An error occurred generating SQL');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Function to execute SQL query
    const executeQuery = async (sqlQuery: string) => {
        console.log("Execute button clicked for SQL:", sqlQuery);
        console.log("Current database config:", dbConfig);
        
        if (!dbConfig) {
            setError("Database not configured. Please configure a database connection first.");
            return;
        }
        
        // Make sure all required fields are present in the dbConfig
        const requiredFields = ['host', 'port', 'database', 'user'];
        const missingFields = requiredFields.filter(field => !dbConfig[field as keyof typeof dbConfig]);
        
        if (missingFields.length > 0) {
            setError(`Database configuration is incomplete. Missing fields: ${missingFields.join(', ')}`);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log("Executing SQL query:", sqlQuery);
            console.log("Database config:", JSON.stringify({
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database,
                user: dbConfig.user,
                hasPassword: !!dbConfig.password
            }));
            
            const result = await window.electronAPI.executeSQL(dbConfig, sqlQuery);
            
            console.log("SQL execution result:", JSON.stringify({
                columns: result.columns,
                rowCount: result.rows ? result.rows.length : 0,
                error: result.error
            }));
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Add result message to context
            addMessageToCurrentChat({
                type: 'result',
                content: result.rows || [],
                columns: result.columns || []
            });
        } catch (err) {
            console.error("SQL execution error:", err);
            setError(err instanceof Error ? err.message : 'An error occurred executing SQL');
        } finally {
            setIsLoading(false);
        }
    };

    // Force enable execution - useful for debugging
    const forceEnableExecution = (event: React.MouseEvent, sqlQuery: string) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log("FORCE EXECUTING SQL, bypassing disabled state");
        console.log("Current dbConfig status:", !!dbConfig);
        
        if (dbConfig) {
            console.log("Database config details:", {
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database,
                user: dbConfig.user,
                hasPassword: !!dbConfig.password
            });
        } else {
            console.log("No database config available. Creating a test config for debugging");
            const testConfig = {
                host: "localhost",
                port: "5432",
                database: "postgres",
                user: "postgres", 
                password: "postgres",
                name: "Test Database"
            };
            console.log("Using test config:", testConfig);
            executeQuery(sqlQuery);
        }
        
        // Execute the query
        if (dbConfig) {
            executeQuery(sqlQuery);
        }
    };

    // Create a new chat if none exists
    useEffect(() => {
        if (!currentChatId) {
            createNewChat();
        }
    }, [currentChatId, createNewChat]);

    // Handle clicks outside of the SQL editing area
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editingSqlId && !(event.target as Element).closest('.sql-edit-area')) {
                saveEditedSql(editingSqlId);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingSqlId, editedSqlContent]);

    return (
        <>
            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Error Message */}
                    {error && (
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-4 flex">
                                <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                                <p className="text-red-500">{error}</p>
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Chat Messages */}
                    {messages.map((message) => {
                        if (message.type === 'user') {
                            // User Message
                            return (
                                <Card key={message.id} className="bg-muted/50">
                                    <CardContent className="pt-4">
                                        <p>{message.content as string}</p>
                                    </CardContent>
                                </Card>
                            );
                        } else if (message.type === 'sql') {
                            // SQL Message
                            return (
                                <Card key={message.id}>
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <h3 className="text-sm font-medium">Generated SQL</h3>
                                        {editingSqlId !== message.id && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => startEditingSql(message.id, message.content as string)}
                                                className="h-6 w-6"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {editingSqlId === message.id ? (
                                            <Textarea
                                                className="sql-edit-area font-mono text-sm min-h-[100px] bg-muted"
                                                value={editedSqlContent}
                                                onChange={(e) => setEditedSqlContent(e.target.value)}
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        setEditingSqlId(null);
                                                    } else if (e.key === 'Enter' && e.ctrlKey) {
                                                        saveEditedSql(message.id);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <pre 
                                                className="bg-muted p-4 rounded-md text-sm overflow-auto cursor-pointer"
                                                onClick={() => startEditingSql(message.id, message.content as string)}
                                            >
                                                {message.content as string}
                                            </pre>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button 
                                            onClick={() => executeQuery(
                                                editingSqlId === message.id 
                                                    ? editedSqlContent 
                                                    : message.content as string
                                            )}
                                            disabled={!dbConfig || isLoading}
                                            className="mr-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Executing...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Execute
                                                </>
                                            )}
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => forceEnableExecution(
                                                e,
                                                editingSqlId === message.id 
                                                    ? editedSqlContent 
                                                    : message.content as string
                                            )}
                                        >
                                            Force Execute
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        } else if (message.type === 'result') {
                            // Result Message
                            return (
                                <Card key={message.id}>
                                    <CardHeader className="pb-2">
                                        <h3 className="text-sm font-medium">Results after running query</h3>
                                    </CardHeader>
                                    <CardContent>
                                        {(message.content as Record<string, unknown>[]).length > 0 ? (
                                            <div className="bg-muted p-4 rounded-md overflow-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr>
                                                            {message.columns?.map((column, i) => (
                                                                <th key={i} className="text-left p-2 border-b">{column}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(message.content as Record<string, unknown>[]).map((row, i) => (
                                                            <tr key={i}>
                                                                {message.columns?.map((column, j) => (
                                                                    <td key={j} className="p-2 border-b">
                                                                        {row[column]?.toString() || ""}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                                                No results returned
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        }
                    })}
                    
                    {/* Empty State */}
                    {messages.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            <p>Enter a natural language query to generate SQL and query your database.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4">
                <div className="max-w-4xl mx-auto flex">
                    <Textarea
                        className="min-h-[80px] flex-1 resize-none"
                        placeholder="Enter your natural language query here..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleSubmit();
                            }
                        }}
                    />
                    <Button 
                        className="ml-2 self-end"
                        onClick={handleSubmit}
                        disabled={!aiConfig || isLoading || !inputValue.trim()}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </>
    )
}

