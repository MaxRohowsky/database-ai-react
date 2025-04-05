import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Settings, Check } from "lucide-react";
import { useAppContext } from "@/context-provider";

// Define supported AI models
const aiModels = [
  { id: "gpt-3.5-turbo", name: "ChatGPT (GPT-3.5)", provider: "openai" },
  { id: "claude-3-haiku", name: "Claude (Haiku)", provider: "claude" }
];

export default function AiConfigDialog() {
  const { aiConfig, setAiConfig } = useAppContext();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-3.5-turbo");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [claudeModel, setClaudeModel] = useState("claude-3-haiku-20240307");
  
  // Initialize current model display
  const selectedModel = aiConfig
    ? aiModels.find(m => m.id === aiConfig.model) || aiModels[0]
    : aiModels[0];

  const handleSelectModel = (model: typeof aiModels[0]) => {
    // Set the active model type based on selection
    if (model.provider === 'openai') {
      setAiConfig({
        provider: 'openai',
        apiKey: openaiApiKey,
        model: openaiModel
      });
    } else if (model.provider === 'claude') {
      setAiConfig({
        provider: 'claude',
        apiKey: claudeApiKey, 
        model: claudeModel
      });
    }
  };

  const handleSaveConfig = () => {
    // Save the current tab's configuration
    const activeTab = document.querySelector('[role="tablist"] [data-state="active"]')?.getAttribute('value');
    
    if (activeTab === 'openai') {
      setAiConfig({
        provider: 'openai',
        apiKey: openaiApiKey,
        model: openaiModel
      });
    } else if (activeTab === 'claude') {
      setAiConfig({
        provider: 'claude',
        apiKey: claudeApiKey,
        model: claudeModel
      });
    }
    
    setAiDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <span className="mr-2">AI: {selectedModel.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {aiModels.map(model => (
            <DropdownMenuItem 
              key={model.id}
              onClick={() => handleSelectModel(model)}
              className="flex justify-between"
            >
              {model.name}
              {selectedModel.id === model.id && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem 
            onClick={() => setAiDialogOpen(true)}
            className="border-t mt-1 pt-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configure AI Models
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
                  <Input 
                    id="openai-api-key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="openai-model" className="text-sm font-medium">Model</label>
                  <select 
                    id="openai-model" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                  >
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
                  <Input 
                    id="claude-api-key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="claude-model" className="text-sm font-medium">Model</label>
                  <select 
                    id="claude-model" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={claudeModel}
                    onChange={(e) => setClaudeModel(e.target.value)}
                  >
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button type="submit" onClick={handleSaveConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
