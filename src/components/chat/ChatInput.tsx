import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useAiConfigStore } from "@/store/ai-config-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { generateSql, fetchDatabaseSchema } from "@/services/sqlService";

export default function ChatInput() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addMessageToCurrentChat } = useChatStore();
  const { config: aiConfig } = useAiConfigStore();
  const { getSelectedConnection } = useDbConnectionStore();
  
  // Function to handle form submission
  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    if (!aiConfig) {
      setError("Please configure an OpenAI API key first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Add user message to chat
    addMessageToCurrentChat({
      type: 'user',
      content: inputValue
    });
    
    const userQuery = inputValue.trim();
    setInputValue("");
    
    try {
      // Get selected DB connection
      const dbConfig = getSelectedConnection();
      
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
      
      // Generate SQL with AI
      const sqlResponse = await generateSql(userQuery, aiConfig, dbSchema);
      
      if (sqlResponse.error) {
        throw new Error(sqlResponse.error);
      }
      
      // Add SQL message to chat
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
  
  // Handle keyboard submission (Ctrl/Cmd + Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t">
      <Textarea
        placeholder="Ask a question about your database..."
        className="min-h-[60px] resize-none"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <Button 
        size="icon" 
        onClick={handleSubmit}
        disabled={isLoading || !inputValue.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
} 