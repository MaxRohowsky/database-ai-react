import Header from "@/components/common/header/header";
import { AppSidebar } from "@/components/common/sidebar/sidebar";
import Chat from "@/features/chat/chat";
import { ChatInput } from "@/features/chat/chat-input";
import { useChatStore } from "@/store/chat-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidebarProvider } from "./components/ui/sidebar";

export function App() {
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

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="relative flex h-screen w-full">
      <SidebarProvider className="absolute inset-0">
        <AppSidebar />

        <main className="ml-0 flex h-screen w-full flex-col">
          <Header />

          <div className="flex-1 overflow-y-auto">
            <Chat
              messages={messages}
              isLoading={isLoading}
              setError={setError}
              setIsLoading={setIsLoading}
            />
          </div>

          <ChatInput
            isLoading={isLoading}
            setError={setError}
            setIsLoading={setIsLoading}
          />
        </main>
      </SidebarProvider>
    </div>
  );
}

export default App;
