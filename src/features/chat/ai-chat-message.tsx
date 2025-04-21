import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { executeSql } from "@/services/sql-service";
import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Edit, Play } from "lucide-react";
import { useState } from "react";

export function DbChatMessage({
  message,
  isLoading,
  setError,
  setIsLoading,
}: {
  message: Message;
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}) {
  const [editingSqlId, setEditingSqlId] = useState<string | null>(null);
  const [editedSqlContent, setEditedSqlContent] = useState<string>("");
  const { updateMessage, addMessageToCurrentChat } = useChatStore();
  const { getSelectedDbConfig } = useDbConnectionStore();
  const dbConfig = getSelectedDbConfig(); // TODO: perhaps move to const above

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
      // TODO: Add toast
      setError(
        "Database not configured. Please configure a database connection first.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = editingSqlId === message.id;

  return (
    <Card className="overflow-hidden rounded-sm border-none p-0 shadow-none">
      <CardContent className="m-0 flex flex-row items-center justify-between bg-slate-50 px-2">
        <div className="m-0 flex flex-1">
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
              className="cursor-pointer overflow-auto rounded-sm bg-slate-50 p-4 font-mono text-sm text-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
              onClick={() =>
                startEditingSql(message.id, message.content as string)
              }
            >
              {message.content as string}
            </pre>
          )}
        </div>
        <div className="flex flex-row items-center gap-2 px-2">
          {!isEditing && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() =>
                startEditingSql(message.id, message.content as string)
              }
              className="group px-4 transition-all"
            >
              <Edit className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:scale-110" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              executeQuery(
                isEditing ? editedSqlContent : (message.content as string),
              )
            }
            disabled={!dbConfig || isLoading}
            className="group px-4 transition-all"
          >
            <Play className="h-4 w-4 text-green-500 transition-transform group-hover:scale-110" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SqlEditor({
  content,
  setContent,
  onSave,
}: {
  content: string;
  setContent: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Textarea
      className="sql-edit-area rounded-sm p-4 font-mono text-sm focus:ring-1 focus:ring-blue-400" /*  min-h-[100px] */
      value={content}
      onChange={(e) => setContent(e.target.value)}
      autoFocus
      onBlur={() => {
        onSave();
      }}
    />
  );
}
