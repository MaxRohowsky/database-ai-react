import Header from "@/components/header/header";
import { AppSidebar } from "@/components/sidebar";
import Chat from "@/features/chat/chat";
import { ChatInput } from "@/features/chat/chat-input";
import { useChatStore } from "@/store/chat-store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";

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
    <SidebarProvider className="border-t">
      <AppSidebar />

      {/* Main Content - Fixed structure with scrollable middle */}
      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex w-full flex-shrink-0 items-center justify-between">
          <SidebarTrigger className="bg-secondary m-4 h-8 w-8" />
          <Header />
        </div>

        {/* Chat - Scrollable area in the middle */}
        <div className="flex-1 overflow-y-auto">
          <Chat
            messages={messages}
            isLoading={isLoading}
            setError={setError}
            setIsLoading={setIsLoading}
          />
        </div>

        {/* Chat Input - Fixed at bottom */}
        <ChatInput
          isLoading={isLoading}
          setError={setError}
          setIsLoading={setIsLoading}
        />
      </main>
    </SidebarProvider>
  );
}

export default App;
