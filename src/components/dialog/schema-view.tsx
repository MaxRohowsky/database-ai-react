import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

interface SchemaViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: string | undefined;
}

interface SchemaTable {
  schema: string;
  name: string;
  columns: SchemaColumn[];
}

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export function SchemaView({ open, onOpenChange, schema }: SchemaViewProps) {
  const [tables, setTables] = useState<Record<string, SchemaTable>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (schema) {
      // Parse the schema text into structured data
      const parsedTables: Record<string, SchemaTable> = {};

      const tableRegex = /Table: (.+?)\.(.+?)\nColumns:\n([\s\S]+?)(?=\n\n|$)/g;
      const columnRegex = /\s+- (.+?) \((.+?)(?:, nullable)?\)/g;

      let tableMatch;
      while ((tableMatch = tableRegex.exec(schema)) !== null) {
        const schemaName = tableMatch[1];
        const tableName = tableMatch[2];
        const columnsText = tableMatch[3];

        const columns: SchemaColumn[] = [];
        let columnMatch;
        while ((columnMatch = columnRegex.exec(columnsText)) !== null) {
          columns.push({
            name: columnMatch[1],
            type: columnMatch[2],
            nullable: columnsText.includes(
              `${columnMatch[1]} (${columnMatch[2]}, nullable`,
            ),
          });
        }

        const tableKey = `${schemaName}.${tableName}`;
        parsedTables[tableKey] = {
          schema: schemaName,
          name: tableName,
          columns,
        };
      }

      setTables(parsedTables);
    }
  }, [schema]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const allTables = Object.entries(tables);

  // Get unique schema names for tabs
  const schemas = [
    ...new Set(Object.values(tables).map((table) => table.schema)),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Database Schema</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-2">
            <TabsTrigger value="all">All Schemas</TabsTrigger>
            {schemas.map((schema) => (
              <TabsTrigger key={schema} value={schema}>
                {schema}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="m-0">
            <SchemaTablesView
              tables={allTables}
              handleCopy={handleCopy}
              copied={copied}
            />
          </TabsContent>

          {schemas.map((schema) => (
            <TabsContent key={schema} value={schema} className="m-0">
              <SchemaTablesView
                tables={allTables.filter(
                  ([, table]) => table.schema === schema,
                )}
                handleCopy={handleCopy}
                copied={copied}
              />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SchemaTablesView({
  tables,
  handleCopy,
  copied,
}: {
  tables: [string, SchemaTable][];
  handleCopy: (text: string) => void;
  copied: string | null;
}) {
  return (
    <ScrollArea className="h-[50vh] pr-4">
      {tables.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center">
          No tables found in database schema.
        </div>
      ) : (
        <div className="space-y-6">
          {tables.map(([tableKey, table]) => (
            <div key={tableKey} className="rounded-md border p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center text-sm font-medium">
                  <span className="text-blue-600">{table.schema}</span>
                  <span className="mx-1 text-gray-400">.</span>
                  <span>{table.name}</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(`${table.schema}.${table.name}`)}
                  className="h-6 w-6 p-0"
                >
                  {copied === `${table.schema}.${table.name}` ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="space-y-1">
                {table.columns.map((column) => (
                  <div
                    key={column.name}
                    className="flex items-center justify-between rounded-sm bg-slate-50 px-2 py-1 text-sm dark:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{column.name}</span>
                      <span className="text-xs text-gray-500">
                        ({column.type}
                        {column.nullable && ", nullable"})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(column.name)}
                      className="h-6 w-6 p-0"
                    >
                      {copied === column.name ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
