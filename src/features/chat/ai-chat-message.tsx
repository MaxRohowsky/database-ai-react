import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { executeSqlQuery } from "@/services/sql-service";
import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Edit, Loader2, Play } from "lucide-react";
import { useEffect, useState } from "react";

export function DbChatMessage({
  message,
  isLoading,
  setError,
  setIsLoading,
}: {
  message: ChatMessage;
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}) {
  const [editingSqlId, setEditingSqlId] = useState<string | null>(null);
  const [editedSqlContent, setEditedSqlContent] = useState<string>("");
  const { updateMessage } = useChatStore();
  const { getSelectedConnection } = useDbConnectionStore();
  const dbConfig = getSelectedConnection();
  const { addMessageToCurrentChat } = useChatStore();

  // Function to start editing SQL
  const startEditingSql = (messageId: string, content: string) => {
    setEditingSqlId(messageId);
    setEditedSqlContent(content);
  };

  // Function to save edited SQL
  const saveEditedSql = (messageId: string) => {
    if (!editedSqlContent.trim()) return;
    updateMessage(messageId, { content: editedSqlContent });
    setEditingSqlId(null);
  };

  // Function to execute SQL query
  const executeQuery = async (sqlQuery: string) => {
    if (!dbConfig) {
      setError(
        "Database not configured. Please configure a database connection first.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if this query has a RETURNING clause (PostgreSQL feature)
      const hasReturningClause = /\bRETURNING\b/i.test(sqlQuery);

      const result = await executeSqlQuery(sqlQuery, dbConfig);
      if (result.error) {
        throw new Error(result.error);
      }

      // Check if it's a modification query by looking for keywords
      const isModification =
        /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)/i.test(
          sqlQuery.trim(),
        );

      // If query has RETURNING clause and returned data, we can store it directly
      if (hasReturningClause && result.rows && result.rows.length > 0) {
        // Add result message to store with special RETURNING data
        addMessageToCurrentChat({
          type: "result",
          content: [], // Leave content empty to trigger the "Database Modified" view
          columns: [],
          affectedRows: result.rows.length,
          originalQuery: sqlQuery,
          returningRows: result.rows,
          returningColumns: result.columns,
        });
      } else {
        // Normal query processing (as before)
        addMessageToCurrentChat({
          type: "result",
          content: result.rows || [],
          columns: result.columns || [],
          // If it's a modification query with zero rows returned, likely affected rows
          affectedRows:
            isModification && result.rows?.length === 0
              ? result.affectedRows
              : undefined,
          // Store the original query for reference
          originalQuery: sqlQuery,
        });
      }
    } catch (err) {
      console.error("SQL execution error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred executing SQL",
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  const isEditing = editingSqlId === message.id;

  return (
    <Card className="overflow-hidden rounded-sm border border-slate-200 shadow-none dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 dark:bg-slate-900/30">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Generated SQL
        </h3>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              startEditingSql(message.id, message.content as string)
            }
            className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <Edit className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isEditing ? (
          <SqlEditor
            content={editedSqlContent}
            setContent={setEditedSqlContent}
            onSave={() => saveEditedSql(message.id)}
            onCancel={() => setEditingSqlId(null)}
          />
        ) : (
          <pre
            id={`sql-message-${message.id}`}
            className="mx-4 cursor-pointer overflow-auto rounded-sm bg-slate-50 p-4 font-mono text-sm text-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
            onClick={() =>
              startEditingSql(message.id, message.content as string)
            }
          >
            {message.content as string}
          </pre>
        )}
      </CardContent>
      <CardFooter className="dark:bg-slate-900/30">
        <Button
          onClick={() =>
            executeQuery(
              isEditing ? editedSqlContent : (message.content as string),
            )
          }
          disabled={!dbConfig || isLoading}
          className="group px-4 transition-all"
          variant={isLoading ? "secondary" : "default"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">Executing...</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium">Execute</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SqlEditor({
  content,
  setContent,
  onSave,
  onCancel,
}: {
  content: string;
  setContent: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Textarea
      className="sql-edit-area min-h-[100px] rounded-sm border-0 bg-slate-50 p-4 font-mono text-sm focus:ring-1 focus:ring-blue-400 dark:bg-slate-900/50 dark:text-slate-300"
      value={content}
      onChange={(e) => setContent(e.target.value)}
      autoFocus
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCancel();
        } else if (e.key === "Enter" && e.ctrlKey) {
          onSave();
        }
      }}
    />
  );
}
