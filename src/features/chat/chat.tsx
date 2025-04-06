import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  executeSqlQuery,
  fetchDatabaseSchema,
  generateSql,
} from "@/services/sqlService";
import { useAiConfigStore } from "@/store/ai-config-store";
import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { AlertCircle, Edit, Loader2, Play, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Chat() {
  const {
    currentChatId,
    getCurrentChat,
    addMessageToCurrentChat,
    createNewChat,
    updateMessage,
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
  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }

    // Also try to scroll to the last message using the ref
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior, block: "end" });
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
      setTimeout(() => scrollToBottom("smooth"), 300),
      setTimeout(() => scrollToBottom(), 500),
    ];

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [messages]);

  // Set up intersection observer to detect when the last message is visible
  useEffect(() => {
    if (!lastMessageRef.current) return;

    const options = {
      root: scrollAreaRef.current,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry.isIntersecting) {
        // If the last message is not visible, scroll to it
        scrollToBottom("smooth");
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
      content: editedSqlContent,
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
      type: "user",
      content: inputValue,
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
        type: "sql",
        content: sqlResponse.sqlQuery,
      });

      // Ensure scroll after SQL generation
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("SQL generation error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred generating SQL",
      );
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
      setError(
        "Database not configured. Please configure a database connection first.",
      );
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
        type: "result",
        content: result.rows || [],
        columns: result.columns || [],
      });

      // Ensure scroll after query execution
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("SQL execution error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred executing SQL",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Force enable execution - useful for debugging

  // Create a new chat if none exists
  useEffect(() => {
    if (!currentChatId) {
      createNewChat();
    }
  }, [currentChatId, createNewChat]);

  // Handle clicks outside of the SQL editing area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingSqlId &&
        !(event.target as Element).closest(".sql-edit-area")
      ) {
        saveEditedSql(editingSqlId);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingSqlId, editedSqlContent]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Chat Area */}

      <div className="mx-auto max-w-7xl space-y-4">
        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex pt-4">
              <AlertCircle className="mt-0.5 mr-2 h-4 w-4 text-red-500" />
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        {messages.map((message, index) => {
          // Determine if this is the last message for ref attachment
          const isLastMessage = index === messages.length - 1;

          if (message.type === "user") {
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
          } else if (message.type === "sql") {
            // SQL Message
            return (
              <Card
                key={message.id}
                ref={isLastMessage ? lastMessageRef : undefined}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <h3 className="text-sm font-medium">Generated SQL</h3>
                  {editingSqlId !== message.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        startEditingSql(message.id, message.content as string)
                      }
                      className="h-6 w-6"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {editingSqlId === message.id ? (
                    <Textarea
                      className="sql-edit-area bg-muted min-h-[100px] font-mono text-sm"
                      value={editedSqlContent}
                      onChange={(e) => setEditedSqlContent(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingSqlId(null);
                        } else if (e.key === "Enter" && e.ctrlKey) {
                          saveEditedSql(message.id);
                        }
                      }}
                    />
                  ) : (
                    <pre
                      className="bg-muted cursor-pointer overflow-auto rounded-md p-4 text-sm"
                      onClick={() =>
                        startEditingSql(message.id, message.content as string)
                      }
                    >
                      {message.content as string}
                    </pre>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() =>
                      executeQuery(
                        editingSqlId === message.id
                          ? editedSqlContent
                          : (message.content as string),
                      )
                    }
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
                </CardFooter>
              </Card>
            );
          } else if (message.type === "result") {
            // Result Message
            return (
              <Card
                key={message.id}
                ref={isLastMessage ? lastMessageRef : undefined}
              >
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-medium">
                    Results after running query
                  </h3>
                </CardHeader>
                <CardContent>
                  {(message.content as Record<string, unknown>[]).length > 0 ? (
                    <div className="bg-muted overflow-auto rounded-md p-4">
                      <table className="w-full">
                        <thead>
                          <tr>
                            {message.columns?.map((column, i) => (
                              <th key={i} className="border-b p-2 text-left">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(message.content as Record<string, unknown>[]).map(
                            (row, i) => (
                              <tr key={i}>
                                {message.columns?.map((column, j) => (
                                  <td key={j} className="border-b p-2">
                                    {row[column]?.toString() || ""}
                                  </td>
                                ))}
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-muted text-muted-foreground rounded-md p-4 text-center">
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
          <div className="text-muted-foreground p-8 text-center">
            <p>
              Enter a natural language query to generate SQL and query your
              database.
            </p>
          </div>
        )}

        {/* Invisible element at the bottom to scroll to */}
        <div ref={lastMessageRef} className="h-0.5 w-full" />
      </div>

      {/* Input Area - Fixed at the bottom */}
      <div className="border-border flex-shrink-0 border-t p-4">
        <div className="mx-auto flex max-w-4xl">
          <Textarea
            className="min-h-[80px] flex-1 resize-none"
            placeholder="Enter your natural language query here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
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
  );
}
