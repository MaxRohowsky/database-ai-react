import { Card, CardContent } from "@/components/ui/card";

// User Message Component
export function UserChatMessage({ message }: { message: Message }) {
  return (
    <Card className="rounded-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50 p-0 shadow-none">
      <CardContent className="">
        <p className="py-4 text-slate-700 dark:text-slate-300">
          {message.content as string}
        </p>
      </CardContent>
    </Card>
  );
}
