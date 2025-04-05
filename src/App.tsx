import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash, Plus, Database } from "lucide-react"
import { useState } from "react"

export function App() {
  const [dbDialogOpen, setDbDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-muted/40 flex flex-col">
        <div className="p-4">
          <Button className="w-full" variant="default">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">AI SQL Generator</h1>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Trash className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              {/* AI Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <span className="mr-2">AI Model: OpenAI</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>OpenAI</DropdownMenuItem>
                  <DropdownMenuItem>Claude</DropdownMenuItem>
                  <div className="p-2 border-t">
                    <Button onClick={() => setAiDialogOpen(true)} variant="outline" size="sm" className="w-full">
                      Configure AI Models
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Database Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center text-red-500">
                    <Database className="mr-2 h-4 w-4" />
                    <span>Database: Disconnected</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Database 1</DropdownMenuItem>
                  <DropdownMenuItem>Database 2</DropdownMenuItem>
                  <div className="p-2 border-t">
                    <Button onClick={() => setDbDialogOpen(true)} variant="outline" size="sm" className="w-full">
                      Connect new database
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="text-sm text-muted-foreground">No Schema Loaded</div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* SQL Message */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium">Generated SQL</h3>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {`-- SQL query will appear here --`}
                </pre>
              </CardContent>
              <CardFooter>
                <Button disabled>Execute</Button>
              </CardFooter>
            </Card>

            {/* Result Message */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium">Results after running query</h3>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                  Run a query to see results
                </div>
              </CardContent>
            </Card>

            {/* Another SQL Message */}
            <Card>
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium">The next Generated SQL query</h3>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {`-- Next SQL query will appear here --`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex">
            <Textarea 
              className="min-h-[80px] flex-1 resize-none"
              placeholder="Enter your natural language query here..."
            />
            <Button className="ml-2 self-end">Submit</Button>
          </div>
        </div>
      </main>

      {/* Database Connection Dialog */}
      <Dialog open={dbDialogOpen} onOpenChange={setDbDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Connect to Database</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="connection-name" className="text-sm font-medium">Connection Name</label>
              <Input id="connection-name" placeholder="My Database" />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="connection-host" className="text-sm font-medium">Host</label>
              <Input id="connection-host" placeholder="localhost" />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="connection-port" className="text-sm font-medium">Port</label>
              <Input id="connection-port" type="number" placeholder="5432" />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="connection-database" className="text-sm font-medium">Database Name</label>
              <Input id="connection-database" placeholder="mydatabase" />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="connection-user" className="text-sm font-medium">Username</label>
              <Input id="connection-user" placeholder="postgres" />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="connection-password" className="text-sm font-medium">Password</label>
              <Input id="connection-password" type="password" placeholder="********" />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline">Test Connection</Button>
            <Button variant="destructive">Delete Connection</Button>
            <Button type="submit">Save Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Configuration Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure AI Models</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="openai">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
            </TabsList>
            
            <TabsContent value="openai" className="py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="openai-api-key" className="text-sm font-medium">API Key</label>
                  <Input id="openai-api-key" type="password" placeholder="sk-..." />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="openai-model" className="text-sm font-medium">Model</label>
                  <select id="openai-model" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="claude" className="py-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="claude-api-key" className="text-sm font-medium">API Key</label>
                  <Input id="claude-api-key" type="password" placeholder="sk-..." />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="claude-model" className="text-sm font-medium">Model</label>
                  <select id="claude-model" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button type="submit">Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
