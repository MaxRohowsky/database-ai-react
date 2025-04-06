import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChatMessage } from "@/store/chat-store";

export function ResultChatMessage({ message }: { message: ChatMessage }) {
  return (
    <Card key={message.id}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">Results after running query</h3>
      </CardHeader>
      <CardContent>
        {(message.content as Record<string, unknown>[]).length > 0 ? (
          <div className="bg-muted overflow-auto rounded-md p-4">
            <table className="w-full">
              <thead>
                <tr>
                  {message.columns?.map((column, i) => (
                    <th key={i} className="border-b p-2 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(message.content as Record<string, unknown>[]).map(
                  (row, i) => (
                    <tr key={i}>
                      {message.columns?.map((column, j) => (
                        <td key={j} className="border-b p-2">
                          {row[column]?.toString() || ""}
                        </td>
                      ))}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground rounded-md p-4 text-center">
            No results returned
          </div>
        )}
      </CardContent>
    </Card>
  );
}
