/* eslint-disable react-refresh/only-export-components */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiModelStore } from "@/store/ai-model-store";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";

interface SelectAiModelDialogProps {
  showSelectAiModelDialog: boolean;
  setShowSelectAiModelDialog: (showSelectAiModelDialog: boolean) => void;
}

interface ApiKeysFormValues {
  openaiApiKey: string;
  anthropicApiKey: string;
}

function SelectAiModelDialog({
  showSelectAiModelDialog,
  setShowSelectAiModelDialog,
}: SelectAiModelDialogProps) {
  const { aiModelConfig, setAiModelConfig } = useAiModelStore();
  const [activeTab, setActiveTab] = useState("openai");

  const form = useForm<ApiKeysFormValues>({
    defaultValues: {
      openaiApiKey: aiModelConfig?.openai?.apiKey || "",
      anthropicApiKey: aiModelConfig?.anthropic?.apiKey || "",
    },
  });

  const handleSaveConfig = (data: ApiKeysFormValues) => {
    // Save the configurations
    setAiModelConfig({
      openai: { apiKey: data.openaiApiKey },
      anthropic: { apiKey: data.anthropicApiKey },
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
          <DialogTitle>Configure API Keys</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSaveConfig)}
            className="space-y-4"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="openai" className="flex items-center gap-2">
                  <img
                    src="./ai-icons/openai.svg"
                    alt="OpenAI Logo"
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px]"
                  />
                  OpenAI
                </TabsTrigger>
                <TabsTrigger
                  value="anthropic"
                  className="flex items-center gap-2"
                >
                  <img
                    src="./ai-icons/anthropic.svg"
                    alt="Anthropic Logo"
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px]"
                  />
                  Anthropic
                </TabsTrigger>
              </TabsList>

              <TabsContent value="openai" className="mt-4">
                <FormField
                  control={form.control}
                  name="openaiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenAI API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="anthropic" className="mt-4">
                <FormField
                  control={form.control}
                  name="anthropicApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anthropic API Key</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk-ant-..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function useSelectAiModelDialog() {
  const [showSelectAiModelDialog, setShowSelectAiModelDialog] = useState(false);

  const SelectAiModelDialogCallback = useCallback(() => {
    return (
      <SelectAiModelDialog
        showSelectAiModelDialog={showSelectAiModelDialog}
        setShowSelectAiModelDialog={setShowSelectAiModelDialog}
      />
    );
  }, [showSelectAiModelDialog, setShowSelectAiModelDialog]);

  return useMemo(
    () => ({
      setShowSelectAiModelDialog,
      SelectAiModelDialog: SelectAiModelDialogCallback,
    }),
    [setShowSelectAiModelDialog, SelectAiModelDialogCallback],
  );
}
