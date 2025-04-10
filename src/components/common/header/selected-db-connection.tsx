import { useDbConnectionStore } from "@/store/db-connection-store";
import { Database } from "lucide-react";

export default function SelectedDBConnection() {
  const { getSelectedConnection } = useDbConnectionStore();

  const selectedConnection = getSelectedConnection();

  return (
    <>
      <div className="flex items-center">
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
    </>
  );
}
