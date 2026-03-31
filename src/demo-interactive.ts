/**
 * Interactive Demo - Chat with the Memory Agent
 *
 * An interactive CLI that lets you chat with the memory agent.
 * Your conversation persists in a local SQLite database.
 * Start a new thread with --new-thread, or continue the default one.
 *
 * Usage:
 *   npx tsx src/demo-interactive.ts                  # default thread
 *   npx tsx src/demo-interactive.ts --new-thread     # start fresh thread
 *   npx tsx src/demo-interactive.ts --resource bob    # chat as "bob"
 */
import * as readline from 'node:readline';
import { mastra } from './mastra.js';

const args = process.argv.slice(2);
const newThread = args.includes('--new-thread');
const resourceIdx = args.indexOf('--resource');
const resourceId = resourceIdx !== -1 ? args[resourceIdx + 1] : 'default-user';
const threadId = newThread ? `thread-${Date.now()}` : `${resourceId}-default`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve));
}

async function main() {
  const agent = mastra.getAgent('memoryAgent');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Mastra Memory Agent - Interactive Chat            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Resource: ${resourceId}`);
  console.log(`  Thread:   ${threadId}`);
  console.log(`  Type "quit" to exit, "info" for memory details\n`);

  while (true) {
    const input = await prompt('You: ');
    const trimmed = input.trim();

    if (!trimmed) continue;
    if (trimmed.toLowerCase() === 'quit') break;

    if (trimmed.toLowerCase() === 'info') {
      console.log(`\n  Resource ID: ${resourceId}`);
      console.log(`  Thread ID:   ${threadId}`);
      console.log(`  DB:          mastra-memory.db`);
      console.log(`  Vectors:     mastra-vectors.db\n`);
      continue;
    }

    try {
      const response = await agent.generate(trimmed, {
        memory: {
          resource: resourceId,
          thread: threadId,
        },
      });
      console.log(`\nAgent: ${response.text}\n`);
    } catch (err: any) {
      console.error(`\nError: ${err.message}\n`);
    }
  }

  rl.close();
  console.log('\nGoodbye! Your memory persists in mastra-memory.db');
}

main().catch(console.error);
