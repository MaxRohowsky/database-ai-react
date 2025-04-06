import Header from "@/components/header/header";
import { Sidebar } from "@/components/sidebar";
import Chat from "@/features/chat/chat";

export function App() {
  return (
    <div className="bg-background flex h-screen">
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <Chat />
      </main>
    </div>
  );
}

export default App;
