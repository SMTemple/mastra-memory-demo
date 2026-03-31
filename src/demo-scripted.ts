/**
 * Scripted Demo - Memory Persistence Across Conversations
 *
 * This demo runs 3 separate "conversations" (threads) with the same user (resource)
 * to show how working memory and semantic recall persist across sessions.
 *
 * Usage: npx tsx src/demo-scripted.ts
 */
import { mastra } from './mastra.js';

const RESOURCE_ID = 'demo-user-001';

async function chat(threadId: string, message: string): Promise<string> {
  const agent = mastra.getAgent('memoryAgent');
  const response = await agent.generate(message, {
    memory: {
      resource: RESOURCE_ID,
      thread: threadId,
    },
  });
  return response.text;
}

function separator(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Mastra Persistent Memory Demo                     ║');
  console.log('║       Showing memory across 3 conversation threads      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // --- Thread 1: Introduce ourselves and set preferences ---
  separator('THREAD 1: First Contact');

  const thread1 = `thread-${Date.now()}-1`;

  console.log('User: "Hi! My name is Sam, I\'m a project manager at Epic Web Studios."');
  let reply = await chat(thread1, "Hi! My name is Sam, I'm a project manager at Epic Web Studios. I prefer concise responses.");
  console.log(`Agent: ${reply}\n`);

  console.log('User: "We\'re working on a website redesign for Acme Corp. Can you look them up?"');
  reply = await chat(thread1, "We're working on a website redesign for Acme Corp. Can you look them up?");
  console.log(`Agent: ${reply}\n`);

  console.log('User: "Great. Can you create a task to review their SEO audit by next Friday?"');
  reply = await chat(thread1, "Great. Can you create a task to review their SEO audit by next Friday?");
  console.log(`Agent: ${reply}\n`);

  // --- Thread 2: New conversation, same user ---
  separator('THREAD 2: Next Day (New Thread, Same User)');

  const thread2 = `thread-${Date.now()}-2`;

  console.log('User: "Hey, what do you remember about me?"');
  reply = await chat(thread2, "Hey, what do you remember about me?");
  console.log(`Agent: ${reply}\n`);

  console.log('User: "What were we working on with that client?"');
  reply = await chat(thread2, "What were we working on with that client?");
  console.log(`Agent: ${reply}\n`);

  console.log('User: "Also, I want to focus on SEO and performance optimization going forward."');
  reply = await chat(thread2, "Also, I want to focus on SEO and performance optimization going forward. Add those to my focus areas.");
  console.log(`Agent: ${reply}\n`);

  // --- Thread 3: Yet another conversation ---
  separator('THREAD 3: A Week Later (Another New Thread)');

  const thread3 = `thread-${Date.now()}-3`;

  console.log('User: "Quick question - what are my focus areas and any open action items?"');
  reply = await chat(thread3, "Quick question - what are my focus areas and any open action items?");
  console.log(`Agent: ${reply}\n`);

  console.log('User: "Look up Widget Co - I might take them on as a new client."');
  reply = await chat(thread3, "Look up Widget Co - I might take them on as a new client.");
  console.log(`Agent: ${reply}\n`);

  separator('DEMO COMPLETE');
  console.log('The agent maintained context across 3 separate conversation threads!');
  console.log('Working memory (user profile) persisted via resource-scoped storage.');
  console.log('Semantic recall found relevant messages from earlier threads.');
  console.log('\nDatabase files created:');
  console.log('  - mastra-memory.db   (threads, messages, working memory)');
  console.log('  - mastra-vectors.db  (semantic embeddings for recall)');
}

main().catch(console.error);
