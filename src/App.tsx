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
        <SidebarTrigger />
        <Header />
        <Chat />
      </main>
    </SidebarProvider>
  );
}

export default App;
