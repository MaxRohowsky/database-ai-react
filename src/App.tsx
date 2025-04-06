import Header from "@/components/header/header";
import { AppSidebar } from "@/components/sidebar";
import Chat from "@/features/chat/chat";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";

export function App() {
  return (
    <SidebarProvider>
      <AppSidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex w-full items-center justify-between border-b">
          <SidebarTrigger className="bg-secondary m-4 h-8 w-8" />
          <Header />
        </div>
        <Chat />
      </main>
    </SidebarProvider>
  );
}

export default App;
