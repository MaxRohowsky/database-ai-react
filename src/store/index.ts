import { initializeAiConfigStore } from "./ai-model-store";
import { initializeChatStore } from "./chat-store";
import { initializeDbConnectionStore } from "./db-connection-store";
import { initializeSettingsStore } from "./settings-store";

export * from "./ai-model-store";
export * from "./chat-store";
export * from "./db-connection-store";
export * from "./settings-store";

export async function initializeStores() {
  // Initialize all stores in parallel
  await Promise.all([
    initializeAiConfigStore(),
    initializeDbConnectionStore(),
    initializeChatStore(),
    initializeSettingsStore(),
  ]);
}
