import { useState, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Textarea } from "../ui/textarea"
import { useAppContext } from "@/context-provider"
import { AlertCircle, Send, Play, Loader2 } from "lucide-react"

interface ChatMessage {
    id: string;
    type: 'user' | 'sql' | 'result';
    content: string | Record<string, unknown>[];
    columns?: string[];
    error?: string;
}

export default function Chat() {
    const { dbConfig, aiConfig } = useAppContext();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    // Function to handle form submission
    const handleSubmit = async () => {
        if (!inputValue.trim() || !aiConfig) return;
        
        setIsLoading(true);
        setError(null);
        
        // Add user message
        const userMessageId = Date.now().toString();
        const userMessage: ChatMessage = {
            id: userMessageId,
            type: 'user',
            content: inputValue
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        
        try {
            // Generate SQL with AI
            const sqlResponse = await window.electronAPI.generateSQL(
                aiConfig, 
                inputValue
            );
            
            if (sqlResponse.error) {
                throw new Error(sqlResponse.error);
            }
            
            // Add SQL message
            const sqlMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'sql',
                content: sqlResponse.sqlQuery
            };
            
            setMessages(prev => [...prev, sqlMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred generating SQL');
        } finally {
            setIsLoading(false);
            
            // Scroll to bottom
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                }
            }, 100);
        }
    };
    
    // Function to execute SQL query
    const executeQuery = async (sqlQuery: string) => {
        if (!dbConfig) {
            setError("Database not configured. Please configure database connection first.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // @ts-expect-error - Type matching issues between context and window API
            const result = await window.electronAPI.executeSQL(dbConfig, sqlQuery);
            
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
            
            // Scroll to bottom
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                }
            }, 100);
        }
    };

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
                                    <CardHeader className="pb-2">
                                        <h3 className="text-sm font-medium">Generated SQL</h3>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                                            {message.content as string}
                                        </pre>
                                    </CardContent>
                                    <CardFooter>
                                        <Button 
                                            onClick={() => executeQuery(message.content as string)}
                                            disabled={!dbConfig || isLoading}
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

