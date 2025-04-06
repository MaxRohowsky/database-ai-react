import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Textarea } from "../ui/textarea"
import { AlertCircle, Send, Play, Loader2, Edit } from "lucide-react"
import { useChatStore } from "@/store/chatStore"
import { useAiConfigStore } from "@/store/aiConfigStore"
import { useDbConnectionStore } from "@/store/dbConnectionStore"
import { generateSql, executeSqlQuery, fetchDatabaseSchema } from "@/services/sqlService"

export default function Chat() {
    const { 
        currentChatId, 
        getCurrentChat, 
        addMessageToCurrentChat,
        createNewChat,
        updateMessage
    } = useChatStore();
    
    const { config: aiConfig } = useAiConfigStore();
    const { getSelectedConnection } = useDbConnectionStore();
    const dbConfig = getSelectedConnection();
    
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const [editingSqlId, setEditingSqlId] = useState<string | null>(null);
    const [editedSqlContent, setEditedSqlContent] = useState<string>("");
    
    // Get the current chat's messages
    const currentChat = getCurrentChat();
    const messages = currentChat?.messages || [];
    
    // Enhanced scroll to bottom function with smoother behavior
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
        
        // Also try to scroll to the last message using the ref
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior, block: 'end' });
        }
    };
    
    // Scroll when messages or loading state changes
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);
    
    // Schedule multiple scrolls with different timings to handle various rendering scenarios
    useEffect(() => {
        // Immediate scroll
        scrollToBottom();
        
        // Delayed scrolls to handle different rendering times
        const timers = [
            setTimeout(() => scrollToBottom(), 100),
            setTimeout(() => scrollToBottom('smooth'), 300),
            setTimeout(() => scrollToBottom(), 500)
        ];
        
        return () => timers.forEach(timer => clearTimeout(timer));
    }, [messages]);
    
    // Set up intersection observer to detect when the last message is visible
    useEffect(() => {
        if (!lastMessageRef.current) return;
        
        const options = {
            root: scrollAreaRef.current,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (!entry.isIntersecting) {
                // If the last message is not visible, scroll to it
                scrollToBottom('smooth');
            }
        }, options);
        
        observer.observe(lastMessageRef.current);
        
        return () => {
            if (lastMessageRef.current) {
                observer.unobserve(lastMessageRef.current);
            }
        };
    }, [messages]);

    // Function to start editing SQL
    const startEditingSql = (messageId: string, content: string) => {
        setEditingSqlId(messageId);
        setEditedSqlContent(content);
    };

    // Function to save edited SQL
    const saveEditedSql = (messageId: string) => {
        if (!editedSqlContent.trim()) return;
        
        // Update the message using the store function
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
        
        // Add user message to store
        addMessageToCurrentChat({
            type: 'user',
            content: inputValue
        });
        
        const userQuery = inputValue.trim();
        setInputValue("");
        
        // Ensure scroll happens after adding the message
        setTimeout(scrollToBottom, 50);
        
        try {
            // Get database schema if a connection is configured
            let dbSchema: string | undefined = undefined;
            if (dbConfig) {
                try {
                    console.log("Fetching database schema for context...");
                    const schemaResult = await fetchDatabaseSchema(dbConfig);
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
            
            // Generate SQL with AI using the service
            const sqlResponse = await generateSql(userQuery, aiConfig, dbSchema);
            
            if (sqlResponse.error) {
                throw new Error(sqlResponse.error);
            }
            
            // Add SQL message to store
            addMessageToCurrentChat({
                type: 'sql',
                content: sqlResponse.sqlQuery
            });
            
            // Ensure scroll after SQL generation
            setTimeout(scrollToBottom, 50);
        } catch (err) {
            console.error("SQL generation error:", err);
            setError(err instanceof Error ? err.message : 'An error occurred generating SQL');
        } finally {
            setIsLoading(false);
            // Final scroll after loading completes
            setTimeout(scrollToBottom, 50);
        }
    };
    
    // Function to execute SQL query
    const executeQuery = async (sqlQuery: string) => {
        console.log("Execute button clicked for SQL:", sqlQuery);
        
        if (!dbConfig) {
            setError("Database not configured. Please configure a database connection first.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Execute the SQL query using the service
            const result = await executeSqlQuery(sqlQuery, dbConfig);
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Add result message to store
            addMessageToCurrentChat({
                type: 'result',
                content: result.rows || [],
                columns: result.columns || []
            });
            
            // Ensure scroll after query execution
            setTimeout(scrollToBottom, 50);
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
            
            // Execute the query with the existing config
            executeQuery(sqlQuery);
        } else {
            console.log("No database config available. Creating a test config for debugging");
            const testConfig = {
                id: "test-debug-id",
                host: "localhost",
                port: "5432",
                database: "postgres",
                user: "postgres", 
                password: "postgres",
                name: "Test Database"
            };
            console.log("Using test config:", testConfig);
            
            // Execute with the test config using the service directly
            executeSqlQuery(sqlQuery, testConfig)
                .then(result => {
                    if (result.error) {
                        setError(result.error);
                    } else {
                        // Add result message to chat
                        addMessageToCurrentChat({
                            type: 'result',
                            content: result.rows || [],
                            columns: result.columns || []
                        });
                    }
                })
                .catch(err => {
                    console.error("Error in force execute:", err);
                    setError(err instanceof Error ? err.message : 'An error occurred during forced execution');
                });
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Chat Area */}
            <ScrollArea className="flex-grow p-4 overflow-y-auto" ref={scrollAreaRef}>
                <div className="space-y-4 max-w-7xl mx-auto">
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
                    {messages.map((message, index) => {
                        // Determine if this is the last message for ref attachment
                        const isLastMessage = index === messages.length - 1;
                        
                        if (message.type === 'user') {
                            // User Message
                            return (
                                <Card 
                                    key={message.id} 
                                    className="bg-muted/50"
                                    ref={isLastMessage ? lastMessageRef : undefined}
                                >
                                    <CardContent className="pt-4">
                                        <p>{message.content as string}</p>
                                    </CardContent>
                                </Card>
                            );
                        } else if (message.type === 'sql') {
                            // SQL Message
                            return (
                                <Card 
                                    key={message.id}
                                    ref={isLastMessage ? lastMessageRef : undefined}
                                >
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
                                <Card 
                                    key={message.id}
                                    ref={isLastMessage ? lastMessageRef : undefined}
                                >
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
                    
                    {/* Invisible element at the bottom to scroll to */}
                    <div ref={lastMessageRef} className="h-0.5 w-full" />
                </div>
            </ScrollArea>

            {/* Input Area - Fixed at the bottom */}
            <div className="border-t border-border p-4 flex-shrink-0">
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
        </div>
    )
}

