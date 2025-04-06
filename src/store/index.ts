import { initializeChatStore } from './chatStore';
import { initializeDbConnectionStore } from './dbConnectionStore';
import { initializeAiConfigStore } from './aiConfigStore';

export * from './chatStore';
export * from './dbConnectionStore';
export * from './aiConfigStore';

export async function initializeStores() {
  // Initialize all stores in parallel
  await Promise.all([
    initializeAiConfigStore(),
    initializeDbConnectionStore(),
    initializeChatStore()
  ]);
} 