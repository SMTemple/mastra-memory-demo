/**
 * Mastra instance - the central hub that registers agents, storage, and tools.
 */
import 'dotenv/config';
import { Mastra } from '@mastra/core';
import { memoryAgent } from './agents/memory-agent.js';
import { store } from './storage.js';

export const mastra = new Mastra({
  agents: { memoryAgent },
  storage: store,
});
