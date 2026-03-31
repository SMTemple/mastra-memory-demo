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

// Typing speed: ~40ms per char for user, ~15ms for agent (faster reader)
const USER_CHAR_MS = 40;
const AGENT_CHAR_MS = 15;
const PAUSE_AFTER_USER = 800;   // brief pause before agent "thinks"
const PAUSE_AFTER_AGENT = 2000; // reading time after agent responds
const PAUSE_AFTER_SECTION = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeOut(text: string, charMs: number) {
  for (const ch of text) {
    process.stdout.write(ch);
    await sleep(charMs);
  }
  process.stdout.write('\n');
}

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

  await typeOut('User: "Hi! My name is Sam, I\'m a project manager at Epic Web Studios."', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  let reply = await chat(thread1, "Hi! My name is Sam, I'm a project manager at Epic Web Studios. I prefer concise responses.");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  await typeOut('User: "We\'re working on a website redesign for Acme Corp. Can you look them up?"', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread1, "We're working on a website redesign for Acme Corp. Can you look them up?");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  await typeOut('User: "Great. Can you create a task to review their SEO audit by next Friday?"', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread1, "Great. Can you create a task to review their SEO audit by next Friday?");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  // --- Thread 2: New conversation, same user ---
  await sleep(PAUSE_AFTER_SECTION);
  separator('THREAD 2: Next Day (New Thread, Same User)');

  const thread2 = `thread-${Date.now()}-2`;

  await typeOut('User: "Hey, what do you remember about me?"', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread2, "Hey, what do you remember about me?");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  await typeOut('User: "What were we working on with that client?"', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread2, "What were we working on with that client?");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  await typeOut('User: "Also, I want to focus on SEO and performance optimization going forward."', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread2, "Also, I want to focus on SEO and performance optimization going forward. Add those to my focus areas.");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  // --- Thread 3: Yet another conversation ---
  await sleep(PAUSE_AFTER_SECTION);
  separator('THREAD 3: A Week Later (Another New Thread)');

  const thread3 = `thread-${Date.now()}-3`;

  await typeOut('User: "Quick question - what are my focus areas and any open action items?"', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread3, "Quick question - what are my focus areas and any open action items?");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  await typeOut('User: "Look up Widget Co - I might take them on as a new client."', USER_CHAR_MS);
  await sleep(PAUSE_AFTER_USER);
  reply = await chat(thread3, "Look up Widget Co - I might take them on as a new client.");
  await typeOut(`Agent: ${reply}`, AGENT_CHAR_MS);
  await sleep(PAUSE_AFTER_AGENT);

  separator('DEMO COMPLETE');
  console.log('The agent maintained context across 3 separate conversation threads!');
  console.log('Working memory (user profile) persisted via resource-scoped storage.');
  console.log('Semantic recall found relevant messages from earlier threads.');
  console.log('\nDatabase files created:');
  console.log('  - mastra-memory.db   (threads, messages, working memory)');
  console.log('  - mastra-vectors.db  (semantic embeddings for recall)');
}

main().catch(console.error);
