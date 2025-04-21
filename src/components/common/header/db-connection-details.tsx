import { SchemaView } from "@/components/dialog/schema-view";
import { fetchDbSchema } from "@/services/sql-service";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SelectedDBConnection() {
  const { getSelectedDbConfig } = useDbConnectionStore();
  const [showSchemaDialog, setShowSchemaDialog] = useState(false);
  const [dbSchema, setDbSchema] = useState<string | undefined>(undefined);
  const [fetchingSchema, setFetchingSchema] = useState(false);

  const selectedDbConfig = getSelectedDbConfig();

  const handleFetchSchema = async () => {
    if (!selectedDbConfig) {
      toast.error("Please select a database connection first");
      return;
    }

    if (fetchingSchema) return;

    setFetchingSchema(true);
    try {
      const schemaResult = await fetchDbSchema(selectedDbConfig);
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
          className={`mr-2 h-4 w-4 ${selectedDbConfig ? "text-blue-600" : ""}`}
        />
        <span className="text-xl font-semibold">
          {selectedDbConfig ? (
            <div className="flex items-center gap-1">
              <span className="">{selectedDbConfig.name}</span>
              {selectedDbConfig.database && (
                <img
                  src={`/db-icons/${selectedDbConfig.engine}.svg`}
                  alt={selectedDbConfig.engine}
                  className="mr-2 h-4 w-4"
                />
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
