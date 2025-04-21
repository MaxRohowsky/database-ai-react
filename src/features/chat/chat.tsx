import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import { useRef } from "react";
import { DbChatMessage } from "./ai-chat-message";
import { ResultChatMessage } from "./db-chat-message";
import { UserChatMessage } from "./user-chat-message";

export default function Chat({
  messages,
  isLoading,
  setError,
  setIsLoading,
}: {
  messages: Message[];
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  useScrollAnchor({
    ref: scrollAnchorRef,
    dependencies: [messages],
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      {/* Chat Messages */}
      {messages.map((message) => {
        switch (message.type) {
          case "user":
            return <UserChatMessage key={message.id} message={message} />;
          case "ai":
            return (
              <DbChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading}
                setError={setError}
                setIsLoading={setIsLoading}
              />
            );
          case "db":
            return <ResultChatMessage key={message.id} message={message} />;
          default:
            return null;
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

      <div ref={scrollAnchorRef} />
    </div>
  );
}
