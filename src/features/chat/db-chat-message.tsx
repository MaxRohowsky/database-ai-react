import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChatMessage } from "@/store/chat-store";

export function ResultChatMessage({ message }: { message: ChatMessage }) {
  return (
    <Card
      key={message.id}
      className="overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800"
    >
      <CardHeader className="bg-slate-50/80 pb-2 dark:bg-slate-900/30">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Results after running query
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        {(message.content as Record<string, unknown>[]).length > 0 ? (
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
                {(message.content as Record<string, unknown>[]).map(
                  (row, i) => (
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
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-none bg-slate-50 p-6 text-center text-sm text-slate-500 italic dark:bg-slate-900/50 dark:text-slate-400">
            No results returned
          </div>
        )}
      </CardContent>
    </Card>
  );
}
