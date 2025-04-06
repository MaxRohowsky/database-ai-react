import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchDatabaseSchema, generateSql } from "@/services/sqlService";
import { useAiConfigStore } from "@/store/ai-config-store";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

export function ChatInput({
  setError,
  setIsLoading,
  isLoading,
}: {
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const { config: aiConfig } = useAiConfigStore();
  const { getSelectedConnection } = useDbConnectionStore();
  const dbConfig = getSelectedConnection();
  const { addMessageToCurrentChat } = useChatStore();

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
    } catch (err) {
      console.error("SQL generation error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred generating SQL",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
  );
}
