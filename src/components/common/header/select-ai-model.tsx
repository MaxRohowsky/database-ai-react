import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAiConfigStore } from "@/store/ai-config-store";
import { Check, Settings } from "lucide-react";
import { useEffect, useState } from "react";

// Define supported AI models - focusing only on OpenAI models
const aiModels = [
  { id: "gpt-3.5-turbo", name: "ChatGPT (GPT-3.5)", provider: "openai" },
  { id: "gpt-4", name: "ChatGPT (GPT-4)", provider: "openai" },
  { id: "gpt-4-turbo", name: "ChatGPT (GPT-4 Turbo)", provider: "openai" },
];

export default function AiConfigDialog() {
  const { config: aiConfig, setConfig } = useAiConfigStore();
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");

  // Initialize form values from saved configuration
  useEffect(() => {
    if (aiConfig) {
      setApiKey(aiConfig.apiKey || "");
      setModel(aiConfig.model || "gpt-3.5-turbo");
    }
  }, [aiConfig]);

  // Initialize current model display
  const selectedModel = aiConfig
    ? aiModels.find((m) => m.id === aiConfig.model) || aiModels[0]
    : aiModels[0];

  const handleSelectModel = (selectedModel: (typeof aiModels)[0]) => {
    // Directly set the config with the current API key and selected model
    setConfig({
      provider: "openai",
      apiKey: apiKey,
      model: selectedModel.id,
    });
  };

  const handleSaveConfig = () => {
    // Save the OpenAI configuration
    setConfig({
      provider: "openai",
      apiKey: apiKey,
      model: model,
    });

    setAiDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <span className="mr-2">
              AI: {selectedModel?.name || "Not Configured"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {aiModels.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleSelectModel(model)}
              className="flex justify-between"
            >
              {model.name}
              {selectedModel?.id === model.id && (
                <Check className="ml-2 h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={() => setAiDialogOpen(true)}
            className="mt-1 border-t pt-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configure API Key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure OpenAI API Key</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="openai-api-key" className="text-sm font-medium">
                  API Key
                </label>
                <Input
                  id="openai-api-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="openai-model" className="text-sm font-medium">
                  Model
                </label>
                <select
                  id="openai-model"
                  className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" onClick={handleSaveConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
