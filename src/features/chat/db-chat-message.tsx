import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { executeSqlQuery } from "@/services/sqlService";
import { ChatMessage } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Check, Search } from "lucide-react";
import { useState } from "react";

export function ResultChatMessage({ message }: { message: ChatMessage }) {
  // Check if the message indicates a database change instead of a data retrieval
  const isDbModification = isModificationQuery(message);

  return (
    <Card
      key={message.id}
      className="overflow-hidden rounded-md border border-slate-200 shadow-none dark:border-slate-800"
    >
      <CardHeader className="dark:bg-slate-900/30">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isDbModification ? "Database Modified" : "Results"}
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        {isDbModification ? (
          <DatabaseChangeMessage message={message} />
        ) : (message.content as Record<string, unknown>[]).length > 0 ? (
          <ResultsTable message={message} />
        ) : (
          <div className="rounded-none bg-slate-50 p-6 text-center text-sm text-slate-500 italic dark:bg-slate-900/50 dark:text-slate-400">
            No results returned
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Extracted results table component for reuse
function ResultsTable({ message }: { message: ChatMessage }) {
  return (
    <div className="overflow-auto p-0">
      <table className="w-full border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            {message.columns?.map((column, i) => (
              <th
                key={i}
                className="border-b border-slate-200 p-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase dark:border-slate-700 dark:text-slate-400"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {(message.content as Record<string, unknown>[]).map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-slate-900"
                  : "bg-slate-50 dark:bg-slate-800/50"
              }
            >
              {message.columns?.map((column, j) => (
                <td
                  key={j}
                  className="p-3 text-sm whitespace-nowrap text-slate-600 dark:text-slate-300"
                >
                  {row[column]?.toString() || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Function to detect if a SQL query was a modification instead of a select
function isModificationQuery(message: ChatMessage): boolean {
  // If we have metadata about affected rows, use that directly
  if (message.affectedRows !== undefined) {
    return true;
  }

  // Zero rows returned could indicate modification query, but only if we're sure
  // This is a fallback, as we should have affectedRows set for modification queries
  if ((message.content as Record<string, unknown>[]).length === 0) {
    return false; // Default to false unless we have explicit info
  }

  return false;
}

// Component to display database changes in a user-friendly way
function DatabaseChangeMessage({ message }: { message: ChatMessage }) {
  const { getSelectedConnection } = useDbConnectionStore();
  const dbConfig = getSelectedConnection();
  const [updatedData, setUpdatedData] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract affected rows count if available
  const affectedRows = message.affectedRows;

  // Fetch the affected rows
  const fetchUpdatedData = async () => {
    if (!dbConfig) {
      setError("Database connection not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if there are already results in the message
      // This would happen when using RETURNING clause
      if (message.returningRows && message.returningColumns) {
        setUpdatedData({
          id: "updated-data",
          type: "result",
          content: message.returningRows,
          columns: message.returningColumns,
          showExactCount: true,
        });
        return;
      }

      // Get the original query to modify
      const originalQuery = message.originalQuery || "";
      if (!originalQuery) {
        setError("Could not find the original query");
        return;
      }

      // For PostgreSQL, we could modify the query to use RETURNING *
      // But since we already executed it, let's do a separate query

      // First, determine the type of modification (UPDATE, INSERT, DELETE)
      const isUpdate = /^\s*UPDATE/i.test(originalQuery);
      const isInsert = /^\s*INSERT/i.test(originalQuery);
      const isDelete = /^\s*DELETE/i.test(originalQuery);

      // For DELETE, we can't show the affected rows since they're gone
      if (isDelete) {
        setError("Cannot show rows that were deleted");
        setIsLoading(false);
        return;
      }

      // We'll extract the table name and WHERE clause from the original query
      let tableName: string | null = null;
      let whereClause: string | null = null;

      if (isUpdate) {
        // Extract table from UPDATE clause
        const tableMatch = originalQuery.match(/UPDATE\s+([^\s]+)/i);
        if (tableMatch) tableName = tableMatch[1];

        // Extract WHERE clause
        const whereMatch = originalQuery.match(/WHERE\s+(.+?)(?:;|\s*$)/is);
        if (whereMatch) whereClause = whereMatch[1].trim();
      } else if (isInsert) {
        // Extract table from INSERT INTO clause
        const tableMatch = originalQuery.match(/INSERT\s+INTO\s+([^\s(]+)/i);
        if (tableMatch) tableName = tableMatch[1];

        // For INSERT, we need to extract the values being inserted
        // This is complex, so let's use a simple approach:
        // If PostgreSQL supports RETURNING but we didn't use it,
        // we can just get the last inserted row(s)
        whereClause = null; // We'll use ORDER BY for inserts
      }

      if (!tableName) {
        setError("Could not determine the affected table");
        setIsLoading(false);
        return;
      }

      // Build a query to fetch the affected rows
      let selectQuery = "";

      if (isUpdate && whereClause) {
        // For UPDATE, use the exact same WHERE clause to get the updated rows
        selectQuery = `SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT ${affectedRows || 10}`;
        console.log("Using original WHERE clause:", selectQuery);
      } else if (isInsert) {
        // For INSERT, try to get the most recently inserted row(s)
        // First try common primary key columns in descending order
        selectQuery = `SELECT * FROM ${tableName} ORDER BY CASE 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${getTableNameWithoutSchema(tableName)}' AND column_name = 'id') THEN id 
          WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${getTableNameWithoutSchema(tableName)}' AND column_name = 'created_at') THEN NULL
          ELSE NULL END DESC NULLS LAST LIMIT ${affectedRows || 10}`;
        console.log("Using insertion order query:", selectQuery);
      }

      // Execute the query
      const result = await executeSqlQuery(selectQuery, dbConfig);

      // Handle possible SQL errors
      if (result.error) {
        // Try a simpler fallback query just getting rows from the table
        const fallbackQuery = `SELECT * FROM ${tableName} LIMIT ${affectedRows || 10}`;
        console.log("Trying fallback simple query:", fallbackQuery);

        try {
          const fallbackResult = await executeSqlQuery(fallbackQuery, dbConfig);

          if (
            !fallbackResult.error &&
            fallbackResult.rows &&
            fallbackResult.rows.length > 0
          ) {
            setUpdatedData({
              id: "updated-data",
              type: "result",
              content: fallbackResult.rows,
              columns: fallbackResult.columns || [],
              // Not showing exact count since it's a fallback
              showExactCount: false,
            });
            return;
          }
        } catch (fallbackErr) {
          console.error("Fallback query error:", fallbackErr);
        }

        throw new Error(`${result.error} (Query: ${selectQuery})`);
      }

      // Check if we got any results
      if (!result.rows || result.rows.length === 0) {
        setError("No data found matching the query criteria");
        return;
      }

      // Update the state with the fetched data
      setUpdatedData({
        id: "updated-data",
        type: "result",
        content: result.rows,
        columns: result.columns || [],
        showExactCount: affectedRows === 1,
      });
    } catch (err) {
      console.error("Error fetching updated data:", err);
      setError(
        err instanceof Error ? err.message : "Error fetching updated data",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center gap-3 rounded-none bg-green-50 p-6 text-center dark:bg-green-900/20">
        <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/30">
          <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Database Updated Successfully
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {affectedRows !== undefined
              ? `${affectedRows} ${affectedRows === 1 ? "row" : "rows"} affected`
              : "Operation completed successfully"}
          </p>
        </div>
      </div>

      {!updatedData && (
        <div className="flex justify-center border-t border-green-100 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-900/10">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUpdatedData}
            disabled={isLoading || !dbConfig}
            className="border-green-200 text-green-700 hover:bg-green-100 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40"
          >
            {isLoading ? (
              <>Loading...</>
            ) : (
              <>
                <Search className="mr-2 h-3 w-3" />
                Show Updated Data
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {updatedData && updatedData.content && (
        <div className="border-t border-green-100 dark:border-green-900/30">
          <div className="border-b border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {updatedData.showExactCount && affectedRows !== undefined
              ? `Updated Row${affectedRows === 1 ? "" : `s (${affectedRows} affected)`}`
              : "Updated Data"}
          </div>
          <ResultsTable message={updatedData} />
        </div>
      )}
    </div>
  );
}

// Helper function to extract table name without schema
function getTableNameWithoutSchema(fullTableName: string): string {
  const parts = fullTableName.split(".");
  return parts.length > 1 ? parts[1] : parts[0];
}
