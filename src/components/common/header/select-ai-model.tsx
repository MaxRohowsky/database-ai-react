import { useSelectAiModelDialog } from "@/components/dialog/select-ai-model-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAiModelStore } from "@/store/ai-model-store";
import { Check, Settings } from "lucide-react";

// Define supported AI models with provider info
const aiModels = [
  // OpenAI models
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai" },
  { id: "gpt-4", name: "GPT-4", provider: "openai" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" },

  // Anthropic models
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "anthropic" },
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic" },
];

export default function AiConfigDialog() {
  const { aiModelConfig, aiModelSelection, setAiModelSelection } =
    useAiModelStore();
  const { setShowSelectAiModelDialog, SelectAiModelDialog } =
    useSelectAiModelDialog();

  // Determine which providers have API keys configured
  const hasOpenAiKey = Boolean(aiModelConfig?.openai?.apiKey);
  const hasAnthropicKey = Boolean(aiModelConfig?.anthropic?.apiKey);
  const hasAnyProviderConfigured = hasOpenAiKey || hasAnthropicKey;

  // Find the current selected model
  const selectedModelId = aiModelSelection?.selectedModel || "";
  const selectedModel = aiModels.find((m) => m.id === selectedModelId);

  // Get model display name
  const getModelDisplayName = () => {
    if (!hasAnyProviderConfigured) return "Configure API Key";
    if (!selectedModel) return "Select Model";
    return selectedModel.name;
  };

  const handleSelectModel = (selectedModel: (typeof aiModels)[0]) => {
    // Check if the API key for this provider exists
    const canUseModel =
      (selectedModel.provider === "openai" && hasOpenAiKey) ||
      (selectedModel.provider === "anthropic" && hasAnthropicKey);

    if (!canUseModel) {
      // If API key doesn't exist, open the dialog to configure it
      setShowSelectAiModelDialog(true);
      return;
    }

    // Update the selected model
    setAiModelSelection({
      selectedModel: selectedModel.id,
      selectedProvider: selectedModel.provider as AiModelProvider,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex w-[190px] items-center">
            <span className="mr-2">Model: {getModelDisplayName()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!hasAnyProviderConfigured ? (
            // If no API keys are configured, only show option to configure
            <DropdownMenuItem
              onClick={() => setShowSelectAiModelDialog(true)}
              className="flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure Your First API Key
            </DropdownMenuItem>
          ) : (
            <>
              {/* Only show OpenAI section if an API key is configured */}
              {hasOpenAiKey && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <img
                      src="./ai-icons/openai.svg"
                      alt="OpenAI Logo"
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                    OpenAI Models
                  </DropdownMenuLabel>
                  {aiModels
                    .filter((model) => model.provider === "openai")
                    .map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className="flex justify-between"
                      >
                        <span className="flex items-center">{model.name}</span>
                        {selectedModel?.id === model.id && (
                          <Check className="ml-2 h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  {hasAnthropicKey && <DropdownMenuSeparator />}
                </>
              )}

              {/* Only show Anthropic section if an API key is configured */}
              {hasAnthropicKey && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <img
                      src="./ai-icons/anthropic.svg"
                      alt="Anthropic Logo"
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                    Anthropic Models
                  </DropdownMenuLabel>
                  {aiModels
                    .filter((model) => model.provider === "anthropic")
                    .map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className="flex justify-between"
                      >
                        <span className="flex items-center">{model.name}</span>
                        {selectedModel?.id === model.id && (
                          <Check className="ml-2 h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowSelectAiModelDialog(true)}
                className="flex items-center"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configure API Keys
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <SelectAiModelDialog />
    </>
  );
}
