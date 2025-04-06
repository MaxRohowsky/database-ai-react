import { Card, CardContent } from "@/components/ui/card";
import { ScrollAnchor } from "@/hooks/scroll-anchor";
import { useChatStore } from "@/store/chat-store";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { DbChatMessage } from "./ai-chat-message";
import { ChatInput } from "./chat-input";
import { ResultChatMessage } from "./db-chat-message";
import { UserChatMessage } from "./user-chat-message";

export default function Chat() {
  const { currentChatId, getCurrentChat, createNewChat } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the current chat's messages
  const currentChat = getCurrentChat();
  const messages = currentChat?.messages || [];

  // Create a new chat if none exists
  useEffect(() => {
    if (!currentChatId) {
      createNewChat();
    }
  }, [currentChatId, createNewChat]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Chat Area */}

      <div className="mx-auto max-w-7xl space-y-4">
        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex pt-4">
              <AlertCircle className="mt-0.5 mr-2 h-4 w-4 text-red-500" />
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        {messages.map((message) => {
          if (message.type === "user") {
            // User Message
            return <UserChatMessage message={message} />;
          } else if (message.type === "sql") {
            // SQL Message
            return <DbChatMessage message={message} />;
          } else if (message.type === "result") {
            // Result Message
            return <ResultChatMessage message={message} />;
          }
        })}

        {/* Empty State */}
        {messages.length === 0 && (
          <div className="text-muted-foreground p-8 text-center">
            <p>
              Enter a natural language query to generate SQL and query your
              database.
            </p>
          </div>
        )}

        <ScrollAnchor dependencies={[messages]} />
      </div>

      <ChatInput
        isLoading={isLoading}
        setError={setError}
        setIsLoading={setIsLoading}
      />
    </div>
  );
}
