/**
 * Persistent Memory Agent
 *
 * Demonstrates all 3 memory types working together:
 * 1. Working Memory  - structured scratchpad (user profile, preferences)
 * 2. Semantic Recall  - vector search over past conversations
 * 3. Message History  - recent conversation context
 */
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { fastembed } from '@mastra/fastembed';
import { z } from 'zod';
import { store, vectorStore } from '../storage.js';
import { lookupClientTool, getCurrentTimeTool, createTaskTool } from '../tools/project-tools.js';

// Working memory schema - the agent's persistent scratchpad
const userProfileSchema = z.object({
  name: z.string().optional().describe('User name'),
  role: z.string().optional().describe('User role or title'),
  company: z.string().optional().describe('Company or organization'),
  timezone: z.string().optional().describe('User timezone'),
  preferences: z.object({
    communicationStyle: z.string().optional().describe('How the user prefers responses: concise, detailed, etc.'),
    focusAreas: z.array(z.string()).optional().describe('Topics or domains the user cares about'),
    avoidTopics: z.array(z.string()).optional().describe('Things the user has asked to avoid'),
  }).optional(),
  recentContext: z.object({
    lastDiscussedTopic: z.string().optional(),
    openQuestions: z.array(z.string()).optional().describe('Unresolved questions from past conversations'),
    actionItems: z.array(z.string()).optional().describe('Pending action items'),
  }).optional(),
});

// Memory instance with all 3 types enabled
const memory = new Memory({
  storage: store,
  vector: vectorStore,
  embedder: fastembed,
  options: {
    // 1. Message History - keep last 40 messages in context
    lastMessages: 40,

    // 2. Working Memory - persistent structured scratchpad
    workingMemory: {
      enabled: true,
      scope: 'resource', // persists across ALL threads for this user
      schema: userProfileSchema,
    },

    // 3. Semantic Recall - search past conversations by meaning
    semanticRecall: {
      topK: 5,           // return top 5 similar messages
      messageRange: 2,    // include 2 surrounding messages for context
      scope: 'resource',  // search across all threads for this user
    },
  },
});

export const memoryAgent = new Agent({
  name: 'memory-agent',
  instructions: `You are a helpful AI assistant with persistent memory. You remember details about users across conversations.

Key behaviors:
- When users share personal details (name, role, preferences), store them in your working memory
- Reference past conversations naturally ("Last time we discussed X...")
- Track action items and open questions between sessions
- Use your tools proactively - look up clients when mentioned, create tasks when action items come up
- Be concise and direct in your responses
- When you recall something from memory, mention it naturally to show continuity

Your working memory persists across all conversations with the same user.
Your semantic recall lets you find relevant past messages even from old threads.`,
  model: 'anthropic/claude-haiku-4-5',
  memory,
  tools: {
    lookupClient: lookupClientTool,
    getCurrentTime: getCurrentTimeTool,
    createTask: createTaskTool,
  },
});
