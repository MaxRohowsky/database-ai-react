import { ScrollAnchor } from "@/hooks/scroll-anchor";
import { ChatMessage } from "@/store/chat-store";
import { DbChatMessage } from "./ai-chat-message";
import { ResultChatMessage } from "./db-chat-message";
import { UserChatMessage } from "./user-chat-message";

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function Chat({
  messages,
  isLoading,
  setError,
  setIsLoading,
}: ChatProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      {/* Chat Messages */}
      {messages.map((message) => {
        if (message.type === "user") {
          // User Message
          return <UserChatMessage key={message.id} message={message} />;
        } else if (message.type === "sql") {
          // SQL Message
          return (
            <DbChatMessage
              key={message.id}
              message={message}
              isLoading={isLoading}
              setError={setError}
              setIsLoading={setIsLoading}
            />
          );
        } else if (message.type === "result") {
          // Result Message
          return <ResultChatMessage key={message.id} message={message} />;
        }
        return null;
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
  );
}
