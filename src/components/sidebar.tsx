import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context-provider';

// Helper function to format date
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

export const Sidebar = () => {
    const { 
      chats, 
      currentChatId, 
      setCurrentChatId, 
      createNewChat, 
      deleteChat 
    } = useAppContext();

    const handleNewChat = () => {
      createNewChat();
    };

    const handleSelectChat = (chatId: string) => {
      setCurrentChatId(chatId);
    };

    const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
      e.stopPropagation();
      deleteChat(chatId);
    };

    return (
        <aside className="w-64 border-r border-border bg-muted/40 flex flex-col h-full">
          <div className="p-4 flex-shrink-0">
            <Button onClick={handleNewChat} className="w-full" variant="default">
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-3">
              <div className="px-4 py-2 pb-4">
                {chats.length > 0 && (
                  <>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">History of previous chats</h4>
                    <div className="space-y-1">
                      {chats.map((chat) => (
                        <div
                          key={chat.id}
                          className="flex items-center group w-full"
                        >
                          <Button 
                            variant={currentChatId === chat.id ? "secondary" : "ghost"} 
                            className="flex-grow justify-start text-left font-normal truncate pr-2 mr-1"
                            onClick={() => handleSelectChat(chat.id)}
                          >
                            <div className="truncate flex-1">
                              {chat.title}
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDate(chat.updatedAt)}
                              </div>
                            </div>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {chats.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">
                    <p>No chat history yet</p>
                    <p className="text-sm mt-1">Start a new chat to begin</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>          
    )
}

