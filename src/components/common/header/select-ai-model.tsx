import { useSelectAiModelDialog } from "@/components/dialog/select-ai-model-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  /*   const [aiDialogOpen, setAiDialogOpen] = useState(false); */
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");

  const { setShowSelectAiModelDialog, SelectAiModelDialog } =
    useSelectAiModelDialog();

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
            onClick={() => setShowSelectAiModelDialog(true)}
            className="mt-1 border-t pt-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configure API Key
          </DropdownMenuItem>
        </DropdownMenuContent>
        <SelectAiModelDialog />
      </DropdownMenu>
    </>
  );
}
