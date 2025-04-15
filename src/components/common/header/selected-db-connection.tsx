import { SchemaView } from "@/components/dialog/schema-view";
import { fetchDatabaseSchema } from "@/services/sql-service";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Database } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SelectedDBConnection() {
  const { getSelectedConnection } = useDbConnectionStore();
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);
  const [dbSchema, setDbSchema] = useState<string | undefined>(undefined);
  const [fetchingSchema, setFetchingSchema] = useState(false);

  const selectedConnection = getSelectedConnection();

  // Add keydown event listener for Tab key
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        if (!e.defaultPrevented) {
          e.preventDefault();
          await handleFetchSchema();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedConnection]); // Re-add listener when connection changes

  const handleFetchSchema = async () => {
    if (!selectedConnection) {
      toast.error("Please select a database connection first");
      return;
    }

    if (fetchingSchema) return;

    setFetchingSchema(true);
    try {
      const schemaResult = await fetchDatabaseSchema(selectedConnection);
      if (schemaResult.error) {
        throw new Error(schemaResult.error);
      }
      setDbSchema(schemaResult.schema);
      setShowSchemaDialog(true);
    } catch (error) {
      console.error("Error fetching schema:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred fetching the database schema",
      );
    } finally {
      setFetchingSchema(false);
    }
  };

  return (
    <>
      <div
        className="flex cursor-pointer items-center"
        onClick={handleFetchSchema}
        title="Click or press Tab to view database schema"
      >
        <Database
          className={`mr-2 h-4 w-4 ${selectedConnection ? "text-blue-600" : ""}`}
        />
        <span className="max-w-[150px] truncate font-medium">
          {selectedConnection ? (
            <div className="flex items-center gap-1">
              <span className="text-blue-600">{selectedConnection.name}</span>
              {selectedConnection.database && (
                <span className="text-muted-foreground text-xs">
                  ({selectedConnection.database})
                </span>
              )}
            </div>
          ) : (
            "Select Database"
          )}
        </span>
      </div>

      {/* Schema Dialog */}
      <SchemaView
        open={showSchemaDialog}
        onOpenChange={setShowSchemaDialog}
        schema={dbSchema}
      />
    </>
  );
}
