import { Card, CardContent } from "@/components/ui/card";

// User Message Component
export function UserChatMessage({ message }: { message: any }) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-4">
        <p>{message.content as string}</p>
      </CardContent>
    </Card>
  );
}
