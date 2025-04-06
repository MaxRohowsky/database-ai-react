import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { executeSqlQuery } from "@/services/sqlService";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium">Generated SQL</h3>
        {!isEditing && (
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
        {isEditing ? (
          <SqlEditor
            content={editedSqlContent}
            setContent={setEditedSqlContent}
            onSave={() => saveEditedSql(message.id)}
            onCancel={() => setEditingSqlId(null)}
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
              isEditing ? editedSqlContent : (message.content as string),
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
      className="sql-edit-area bg-muted min-h-[100px] font-mono text-sm"
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
