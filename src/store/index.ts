import { initializeChatStore } from './chat-store';
import { initializeDbConnectionStore } from './db-connection-store';
import { initializeAiConfigStore } from './ai-config-store';

export * from './chat-store';
export * from './db-connection-store';
export * from './ai-config-store';

export async function initializeStores() {
  // Initialize all stores in parallel
  await Promise.all([
    initializeAiConfigStore(),
    initializeDbConnectionStore(),
    initializeChatStore()
  ]);
} 