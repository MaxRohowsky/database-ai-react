import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { useSettingsStore } from "@/store/settings-store";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { executeSql, fetchDbSchema, generateSql } from "@/services/sql-service";
import { useAiModelStore } from "@/store/ai-model-store";
import { ChevronUp, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [enterToSend, setEnterToSend] = useState(false);
  const { autoExecuteSql, setAutoExecuteSql } = useSettingsStore();
  const { aiModelConfig, aiModelSelection } = useAiModelStore();
  const { getSelectedDbConfig } = useDbConnectionStore();
  const dbConfig = getSelectedDbConfig();
  const { addMessageToCurrentChat } = useChatStore();

  // Load enter-to-send preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem("enterToSend");
    if (savedPreference !== null) {
      setEnterToSend(savedPreference === "true");
    }
  }, []);

  // Save enter-to-send preference to localStorage
  const toggleEnterToSend = (value: boolean) => {
    setEnterToSend(value);
    localStorage.setItem("enterToSend", value.toString());
  };

  const toggleAutoExecuteSql = (value: boolean) => {
    setAutoExecuteSql(value);
  };

  const executeGeneratedSql = async (sqlQuery: string) => {
    if (!dbConfig) {
      setError(
        "Database not configured. Please configure a database connection first.",
      );
      return;
    }

    try {
      const result = await executeSql(sqlQuery, dbConfig);

      if (result.error) {
        throw new Error(result.error);
      }

      // Check if it's a modification query by looking for keywords
      const isModification =
        /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)/i.test(
          sqlQuery.trim(),
        );

      // Normal query processing
      addMessageToCurrentChat({
        type: "db",
        content: {
          rows: result.rows || [],
          columns: result.columns || [],
          // If it's a modification query with zero rows returned, likely affected rows
          affectedRows:
            isModification && result.rows?.length === 0
              ? result.affectedRows
              : undefined,
          // Store the original query for reference
          sqlQuery: sqlQuery,
        },
      });
    } catch (err) {
      console.error("SQL execution error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred executing SQL",
      );
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    if (!aiModelConfig || !aiModelSelection) {
      setError("Please configure an OpenAI API key first and select a model.");
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
          const schemaResult = await fetchDbSchema(dbConfig);
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

      const apiKey = getSelectedModelApiKey(aiModelConfig, aiModelSelection);

      if (!apiKey) {
        setError(
          "Please configure an OpenAI API key first and select a model.",
        );
        return;
      }

      // Generate SQL with AI using the service
      const sqlResponse = await generateSql(
        aiModelSelection, // prov & model
        apiKey,
        userQuery,
        dbSchema,
      );

      if (sqlResponse.error) {
        throw new Error(sqlResponse.error);
      }

      // Add SQL message to store
      addMessageToCurrentChat({
        type: "ai",
        content: sqlResponse.sqlQuery,
      });

      // If auto-execute is enabled, execute the SQL immediately
      if (autoExecuteSql && dbConfig) {
        await executeGeneratedSql(sqlResponse.sqlQuery);
      }
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
    <div className="border-border sticky bottom-0 flex-shrink-0 border-t bg-white/80 p-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-3xl">
        <Textarea
          className="focus:ring-opacity-50 min-h-[100px] resize-none rounded-md"
          style={{ fontSize: "16px" }}
          placeholder="Enter your natural language query here..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              if (enterToSend) {
                e.preventDefault();
                handleSubmit();
              }
            } else if (e.key === "Enter" && e.ctrlKey) {
              handleSubmit();
            }
          }}
        />

        <div className="ml-2 flex flex-col self-end">
          <div className="flex items-center">
            <Button
              variant="outline"
              className={"w-[100px] rounded-r-none bg-blue-500 text-white"}
              onClick={handleSubmit}
              disabled={!aiModelConfig || isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-6 w-6" />
                  <span>Send</span>
                </div>
              )}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={"rounded-l-none border-l-0 px-2 shadow-none"}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-50 p-3" align="end">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enter-to-send" className="text-sm">
                      Enter to Send
                    </Label>
                    <Switch
                      id="enter-to-send"
                      checked={enterToSend}
                      onCheckedChange={toggleEnterToSend}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-execute-sql" className="text-sm">
                      Auto Execute SQL
                    </Label>
                    <Switch
                      id="auto-execute-sql"
                      checked={autoExecuteSql}
                      onCheckedChange={toggleAutoExecuteSql}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSelectedModelApiKey(
  config: AiModelConfig,
  selection: AiModelSelection,
): string | null {
  switch (selection.selectedProvider) {
    case "openai":
      return config.openai?.apiKey ?? null;
    case "anthropic":
      return config.anthropic?.apiKey ?? null;
    default:
      return null;
  }
}
