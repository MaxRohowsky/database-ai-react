import { Card, CardContent } from "@/components/ui/card";

// User Message Component
export function UserChatMessage({ message }: { message: ChatMessage }) {
  return (
    <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm dark:from-blue-950/40 dark:to-indigo-950/30">
      <CardContent className="px-5 pt-4">
        <p className="text-slate-700 dark:text-slate-300">
          {message.content as string}
        </p>
      </CardContent>
    </Card>
  );
}
