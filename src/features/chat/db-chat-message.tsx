import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { executeSqlQuery, fetchDatabaseSchema } from "@/services/sqlService";
import { ChatMessage } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Check, Search } from "lucide-react";
import { useEffect, useState } from "react";

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

// Interface for the schema information
interface SchemaTable {
  name: string;
  schema: string;
  columns: string[];
}

// Component to display database changes in a user-friendly way
function DatabaseChangeMessage({ message }: { message: ChatMessage }) {
  const { getSelectedConnection } = useDbConnectionStore();
  const dbConfig = getSelectedConnection();
  const [updatedData, setUpdatedData] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbSchema, setDbSchema] = useState<Record<string, SchemaTable>>({});
  const [schemaLoaded, setSchemaLoaded] = useState(false);

  // Extract affected rows count if available
  const affectedRows = message.affectedRows;

  // Fetch schema information when component mounts
  useEffect(() => {
    if (dbConfig && !schemaLoaded) {
      loadDatabaseSchema();
    }
  }, [dbConfig]);

  // Load database schema
  const loadDatabaseSchema = async () => {
    if (!dbConfig) return;

    try {
      const result = await fetchDatabaseSchema(dbConfig);

      if (result.error) {
        console.error("Error fetching schema:", result.error);
        return;
      }

      if (result.schema) {
        // Parse the schema string into a more usable format
        const schemaMap: Record<string, SchemaTable> = {};
        const lines = result.schema.split("\n");

        let currentTable: SchemaTable | null = null;

        for (const line of lines) {
          // Match table line like "Table: public.user"
          const tableMatch = line.match(/Table: ([^.]+)\.([^\s]+)/);
          if (tableMatch) {
            const schema = tableMatch[1];
            const name = tableMatch[2];
            currentTable = {
              schema,
              name,
              columns: [],
            };
            schemaMap[`${schema}.${name}`] = currentTable;
            continue;
          }

          // Match column lines like "  - email (character varying, nullable)"
          if (currentTable && line.trim().startsWith("-")) {
            const colMatch = line.match(/- ([^\s(]+)/);
            if (colMatch) {
              currentTable.columns.push(colMatch[1]);
            }
          }
        }

        console.log("Parsed schema:", schemaMap);
        setDbSchema(schemaMap);
      }
    } catch (err) {
      console.error("Error processing schema:", err);
    } finally {
      setSchemaLoaded(true);
    }
  };

  // Generate a SELECT query based on the modification query
  const fetchUpdatedData = async () => {
    if (!dbConfig) {
      setError("Database connection not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try to use the stored originalQuery if available
      let sqlText = message.originalQuery || "";

      // If originalQuery isn't available, try to find the SQL message in the DOM
      if (!sqlText) {
        const sqlMessageId = parseInt(message.id) - 1;
        const sqlMessageElement = document.getElementById(
          `sql-message-${sqlMessageId}`,
        );
        if (sqlMessageElement) {
          sqlText = sqlMessageElement.textContent || "";
        }
      }

      if (!sqlText) {
        setError("Could not find the original query");
        return;
      }

      console.log("Original SQL:", sqlText);

      // Parse the SQL to determine what table was affected and construct a SELECT
      // Handle common SQL patterns for different statement types
      let tableMatch = sqlText.match(
        /^\s*(UPDATE|INSERT\s+INTO|DELETE\s+FROM)\s+([^\s(]+)/i,
      );

      // If the standard pattern doesn't match, try more specific patterns
      if (!tableMatch) {
        if (/UPDATE/i.test(sqlText)) {
          tableMatch = sqlText.match(/UPDATE\s+([^\s]+)/i);
          if (tableMatch) tableMatch = ["", "UPDATE", tableMatch[1]];
        } else if (/INSERT/i.test(sqlText)) {
          tableMatch = sqlText.match(/INSERT\s+INTO\s+([^\s(]+)/i);
          if (tableMatch) tableMatch = ["", "INSERT INTO", tableMatch[1]];
        } else if (/DELETE/i.test(sqlText)) {
          tableMatch = sqlText.match(/DELETE\s+FROM\s+([^\s(]+)/i);
          if (tableMatch) tableMatch = ["", "DELETE FROM", tableMatch[1]];
        }
      }

      // Try to extract the full WHERE clause, including quoted values
      // This regex captures everything between WHERE and semicolon/end, handling quotes properly
      const whereClauseRegex = /WHERE\s+(.*?)(?:;|\s*$)/is;
      const whereMatch = sqlText.match(whereClauseRegex);

      if (!tableMatch) {
        setError("Could not determine the affected table");
        return;
      }

      const action = tableMatch[1].toUpperCase().trim();
      let table = tableMatch[2].trim();
      let schema = "public"; // Default schema

      // Check if table includes a schema prefix like "public.user"
      if (table.includes(".")) {
        const parts = table.split(".");
        schema = parts[0];
        table = parts[1];
      }

      // Use the schema information to get the fully qualified table name
      let fullyQualifiedTable = `${schema}.${table}`;

      // Check if this table exists in our schema
      if (
        !Object.keys(dbSchema).some(
          (key) => key.toLowerCase() === fullyQualifiedTable.toLowerCase(),
        )
      ) {
        // Try to find the table with case-insensitive matching
        const possibleMatch = Object.keys(dbSchema).find(
          (key) => key.toLowerCase().split(".")[1] === table.toLowerCase(),
        );

        if (possibleMatch) {
          fullyQualifiedTable = possibleMatch;
          const parts = possibleMatch.split(".");
          schema = parts[0];
          table = parts[1];
        }
      }

      console.log("Using table:", fullyQualifiedTable);

      // Extract where clause, cleaning up any trailing characters
      let whereClause = "";
      if (whereMatch && whereMatch[1]) {
        whereClause = whereMatch[1].trim();
        // Remove trailing semicolons
        whereClause = whereClause.replace(/;$/, "").trim();
      }

      console.log("Extracted table:", table);
      console.log("Extracted schema:", schema);
      console.log("Extracted WHERE clause:", whereClause);

      // For UPDATE queries, try a direct approach - use the same WHERE clause
      // but with the schema-qualified table name
      if (action.includes("UPDATE") || action.includes("INSERT")) {
        try {
          const schemaQualifiedQuery = `SELECT * FROM ${fullyQualifiedTable}${whereClause ? ` WHERE ${whereClause}` : ""} LIMIT 10`;
          console.log(
            "Attempting schema-qualified query:",
            schemaQualifiedQuery,
          );

          const result = await executeSqlQuery(schemaQualifiedQuery, dbConfig);

          if (!result.error && result.rows && result.rows.length > 0) {
            setUpdatedData({
              id: "updated-data",
              type: "result",
              content: result.rows || [],
              columns: result.columns || [],
            });
            return;
          }
        } catch (directErr) {
          console.error(
            "Schema-qualified query failed, trying fallback approach:",
            directErr,
          );
          // Continue with fallback approach
        }
      }

      // Fallback approach - try to extract conditions from the WHERE clause
      // Extract column names and values from the WHERE clause
      const conditions: [string, string][] = [];

      // Try to extract condition from UPDATE email = 'value' WHERE email = 'value'
      if (action.includes("UPDATE")) {
        // Extract SET clause
        const setMatch = sqlText.match(/SET\s+(.*?)(?:WHERE|;|\s*$)/i);
        if (setMatch && setMatch[1]) {
          // Parse assignments like "column1 = 'value1', column2 = value2"
          const assignments = setMatch[1].split(",").map((part) => part.trim());

          for (const assignment of assignments) {
            const [column, value] = assignment.split("=").map((p) => p.trim());

            // If we have both column and value, use it in our query
            if (column && value) {
              // Keep only the column name without quotes
              const cleanColumn = column.replace(/['"]/g, "");
              conditions.push([cleanColumn, value]);
            }
          }
        }
      }

      // Always try to extract from WHERE clause as well
      if (whereClause) {
        // Handle AND/OR conditions
        const parts = whereClause.split(/\s+AND\s+/i);
        for (const part of parts) {
          // Match column = value pattern
          const condMatch = part.match(/([^\s=]+)\s*=\s*([^;\s]+)/);
          if (condMatch) {
            // Extract column name and value
            const column = condMatch[1].trim().replace(/['"]/g, "");
            const value = condMatch[2].trim();

            // Handle quoted values, ensuring quotes are preserved
            if (
              (value.startsWith("'") && value.endsWith("'")) ||
              (value.startsWith('"') && value.endsWith('"'))
            ) {
              // Keep quotes for string values
              conditions.push([column, value]);
            } else {
              // Add quotes for bare values that look like strings
              conditions.push([column, value]);
            }
          }
        }
      }

      // Build a new SELECT query with the extracted conditions
      // Using the schema-qualified table name
      let selectQuery = `SELECT * FROM ${fullyQualifiedTable}`;
      if (conditions.length > 0) {
        selectQuery += " WHERE ";
        selectQuery += conditions
          .map(([col, val]) => `${col} = ${val}`)
          .join(" AND ");
      }
      selectQuery += " LIMIT 10";

      console.log("Final query for updated data:", selectQuery);

      // Execute the query
      const result = await executeSqlQuery(selectQuery, dbConfig);

      if (result.error) {
        // Try one more fallback - use original WHERE clause without parsing
        if (whereClause) {
          const rawFallbackQuery = `SELECT * FROM ${fullyQualifiedTable} WHERE ${whereClause} LIMIT 10`;
          console.log(
            "Trying raw fallback query with original WHERE:",
            rawFallbackQuery,
          );

          try {
            const rawFallbackResult = await executeSqlQuery(
              rawFallbackQuery,
              dbConfig,
            );

            if (
              !rawFallbackResult.error &&
              rawFallbackResult.rows &&
              rawFallbackResult.rows.length > 0
            ) {
              setUpdatedData({
                id: "updated-data",
                type: "result",
                content: rawFallbackResult.rows || [],
                columns: rawFallbackResult.columns || [],
              });
              return;
            }
          } catch (fallbackErr) {
            console.error("Raw fallback query also failed:", fallbackErr);
          }
        }

        // Final fallback: Try without schema prefix
        const noSchemaQuery = `SELECT * FROM ${table}${whereClause ? ` WHERE ${whereClause}` : ""} LIMIT 10`;
        console.log("Trying query without schema:", noSchemaQuery);

        try {
          const noSchemaResult = await executeSqlQuery(noSchemaQuery, dbConfig);

          if (
            !noSchemaResult.error &&
            noSchemaResult.rows &&
            noSchemaResult.rows.length > 0
          ) {
            setUpdatedData({
              id: "updated-data",
              type: "result",
              content: noSchemaResult.rows || [],
              columns: noSchemaResult.columns || [],
            });
            return;
          }
        } catch (noSchemaErr) {
          console.error("No-schema query also failed:", noSchemaErr);
        }

        // If all attempts failed, show the original error
        throw new Error(`${result.error} (Query: ${selectQuery})`);
      }

      // Check if we got any results back
      if (!result.rows || result.rows.length === 0) {
        // If we couldn't get results with our WHERE clause, try just the table
        const fallbackQuery = `SELECT * FROM ${fullyQualifiedTable} LIMIT 10`;
        console.log(
          "Trying fallback query without WHERE clause:",
          fallbackQuery,
        );

        const fallbackResult = await executeSqlQuery(fallbackQuery, dbConfig);

        if (
          fallbackResult.error ||
          !fallbackResult.rows ||
          fallbackResult.rows.length === 0
        ) {
          setError("No data found matching the query criteria");
          return;
        }

        // Use the fallback result
        setUpdatedData({
          id: "updated-data",
          type: "result",
          content: fallbackResult.rows || [],
          columns: fallbackResult.columns || [],
        });
        return;
      }

      // Update the state with the fetched data
      setUpdatedData({
        id: "updated-data",
        type: "result",
        content: result.rows || [],
        columns: result.columns || [],
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
            Updated Data
          </div>
          <ResultsTable message={updatedData} />
        </div>
      )}
    </div>
  );
}
