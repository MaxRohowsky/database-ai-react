import { Sidebar } from "@/components/sidebar"
import Header from "@/components/header/header"
import Chat from "@/features/chat/chat"

export function App() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar/>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header/>
        <Chat/>
      </main>
    </div>
  )
}

export default App
