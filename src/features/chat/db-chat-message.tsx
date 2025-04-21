import { Card, CardContent } from "@/components/ui/card";

export function ResultChatMessage({ message }: { message: Message }) {
  return (
    <Card
      key={message.id}
      className="overflow-hidden rounded-md border border-slate-200 p-0 shadow-none dark:border-slate-800"
    >
      <CardContent className="p-0">
        <ResultsTable message={message} />
      </CardContent>
    </Card>
  );
}

// Extracted results table component for reuse
function ResultsTable({ message }: { message: Message }) {
  const content = message.content as SqlExecutionResponse;
  const rows = content.rows;

  if (!rows?.length) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Empty
      </div>
    );
  }

  return (
    <>
      <div className="overflow-auto p-0">
        <table className="w-full border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              {content.columns?.map((column, i) => (
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
            {content.rows?.map((row, i) => (
              <tr
                key={i}
                className={
                  i % 2 === 0
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50 dark:bg-slate-800/50"
                }
              >
                {content.columns?.map((column, j) => (
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
    </>
  );
}
