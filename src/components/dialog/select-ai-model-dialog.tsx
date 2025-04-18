/* eslint-disable react-refresh/only-export-components */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAiConfigStore } from "@/store/ai-config-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "../ui/input";

interface SelectAiModelDialogProps {
  showSelectAiModelDialog: boolean;
  setShowSelectAiModelDialog: (showSelectAiModelDialog: boolean) => void;
}

function SelectAiModelDialog({
  showSelectAiModelDialog,
  setShowSelectAiModelDialog,
}: SelectAiModelDialogProps) {
  const { config: aiConfig, setConfig } = useAiConfigStore();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");

  useEffect(() => {
    if (aiConfig) {
      setApiKey(aiConfig.apiKey || "");
      setModel(aiConfig.model || "gpt-3.5-turbo");
    }
  }, [aiConfig]);

  const handleSaveConfig = () => {
    // Save the OpenAI configuration
    setConfig({
      provider: "openai",
      apiKey: apiKey,
      model: model,
    });

    setShowSelectAiModelDialog(false);
  };

  return (
    <Dialog
      open={showSelectAiModelDialog}
      onOpenChange={setShowSelectAiModelDialog}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select AI Model</DialogTitle>
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
  );
}

export function useSelectAiModelDialog() {
  const [showSelectAiModelDialog, setShowSelectAiModelDialog] = useState(false);
  const [aiModel, setAiModel] = useState<string>("gpt-3.5-turbo");

  const SelectAiModelDialogCallback = useCallback(() => {
    if (!aiModel) return null;

    return (
      <SelectAiModelDialog
        showSelectAiModelDialog={showSelectAiModelDialog}
        setShowSelectAiModelDialog={setShowSelectAiModelDialog}
      />
    );
  }, [showSelectAiModelDialog, setShowSelectAiModelDialog, aiModel]);

  return useMemo(
    () => ({
      setShowSelectAiModelDialog,
      setAiModel,
      SelectAiModelDialog: SelectAiModelDialogCallback,
    }),
    [setShowSelectAiModelDialog, SelectAiModelDialogCallback],
  );
}
