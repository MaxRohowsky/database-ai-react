
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Plus } from 'lucide-react';

const handleClick =  () => {
    window.electronAPI.sayHi();
};

export const Sidebar = () => {
    return (
        <aside className="w-64 border-r border-border bg-muted/40 flex flex-col">
        <div className="p-4">
          <Button onClick={handleClick} className="w-full" variant="default">
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="px-4 py-2">
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">History of previous chats</h4>
            <div className="space-y-1">
              {Array(5).fill(0).map((_, i) => (
                <Button 
                  key={i}
                  variant="ghost" 
                  className="w-full justify-start text-left font-normal truncate"
                >
                  Chat history item {i+1}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </aside>          
    )
}

