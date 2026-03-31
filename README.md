# Mastra Persistent Memory Demo

A working prototype demonstrating [Mastra.ai](https://mastra.ai/)'s persistent memory system for AI agents. Shows how agents can remember users across conversations using working memory, semantic recall, and message history.

## Memory Types Demonstrated

| Type | What It Does | Scope |
|------|-------------|-------|
| **Working Memory** | Structured scratchpad (name, preferences, action items) persisted via Zod schema | Cross-thread (resource-scoped) |
| **Semantic Recall** | Vector similarity search over past messages using embeddings | Cross-thread (resource-scoped) |
| **Message History** | Last N messages from the current conversation thread | Per-thread |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Memory Agent                      │
│  (Claude Haiku 4.5 + tools + persistent memory)     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Working Memory          Semantic Recall             │
│  ┌──────────────┐       ┌──────────────┐            │
│  │ User Profile  │       │ Vector Search │            │
│  │ Preferences   │       │ Past Messages │            │
│  │ Action Items  │       │ (top-K + ctx) │            │
│  └──────┬───────┘       └──────┬───────┘            │
│         │                      │                     │
│  ┌──────┴──────────────────────┴───────┐            │
│  │         LibSQL Storage               │            │
│  │  mastra-memory.db  mastra-vectors.db │            │
│  └──────────────────────────────────────┘            │
│                                                      │
│  Tools: lookupClient, getCurrentTime, createTask     │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Set your API key
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY (or OPENAI_API_KEY)

# Run the scripted demo (3 conversations showing memory persistence)
npm run demo

# Or start an interactive chat session
npm run chat

# Start a new thread (same user, fresh conversation)
npm run chat:new

# Chat as a different user
npx tsx src/demo-interactive.ts --resource alice
```

## What the Scripted Demo Shows

The scripted demo (`npm run demo`) runs 3 separate conversation threads with the same user to demonstrate cross-session memory:

1. **Thread 1** - User introduces themselves, discusses a client (triggers tool use), creates a task
2. **Thread 2** - New conversation; agent remembers user's name, role, and what they discussed
3. **Thread 3** - Another new conversation; agent recalls focus areas, action items, and can reference earlier threads

## Key Files

```
src/
├── mastra.ts              # Mastra instance setup
├── storage.ts             # LibSQL storage + vector config
├── agents/
│   └── memory-agent.ts    # Agent with all 3 memory types
├── tools/
│   └── project-tools.ts   # Demo tools (CRM lookup, tasks, time)
├── demo-scripted.ts       # Automated 3-thread demo
└── demo-interactive.ts    # Interactive CLI chat
```

## How Memory Works

### Working Memory (Scratchpad)
- Defined with a Zod schema: name, role, preferences, action items, etc.
- Agent automatically updates it as users share information
- **Resource-scoped**: persists across ALL conversation threads for the same user
- Stored in `mastra-memory.db` in the `mastra_resources` table

### Semantic Recall (Vector Search)
- New messages are embedded and stored in `mastra-vectors.db`
- When the agent receives a message, it searches for semantically similar past messages
- Returns top-K matches with surrounding context messages
- **Resource-scoped**: searches across all threads for the same user

### Message History
- Keeps the last 40 messages in the current thread's context window
- Stored in `mastra-memory.db` in the `mastra_messages` table

## Swapping to Production Storage

Replace LibSQL with PostgreSQL for production:

```typescript
// src/storage.ts
import { PostgresStore } from '@mastra/pg';

export const store = new PostgresStore({
  connectionString: process.env.DATABASE_URL!,
});
```

## Extending This

- **Observational Memory**: Add `observationalMemory: true` in memory options for automatic conversation compression (great for long-running agents)
- **Multi-Agent Sharing**: Multiple agents can share memory by using the same `resource` identifier
- **Read-Only Memory**: Sub-agents can reference working memory without modifying it via `readOnly: true`

## Requirements

- Node.js 22+
- An Anthropic API key (or OpenAI key - change the model in `memory-agent.ts`)
