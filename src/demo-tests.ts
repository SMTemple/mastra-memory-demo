/**
 * Memory Feature Test Suite
 *
 * Runs targeted tests against each memory capability with pass/fail assertions.
 * Great for demos - shows exactly what each memory type does.
 *
 * Usage: npx tsx src/demo-tests.ts
 *        npm test
 */
import 'dotenv/config';
import { mastra } from './mastra.js';

const agent = mastra.getAgent('memoryAgent');
const RESOURCE = `test-user-${Date.now()}`;
let threadNum = 0;

function newThread(): string {
  return `test-thread-${Date.now()}-${++threadNum}`;
}

async function chat(thread: string, message: string): Promise<string> {
  const response = await agent.generate(message, {
    memory: { resource: RESOURCE, thread },
  });
  return response.text;
}

// ── Test runner ──────────────────────────────────────────

type Test = { name: string; fn: () => Promise<void> };
const tests: Test[] = [];
let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void>) {
  tests.push({ name, fn });
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertContainsAny(text: string, keywords: string[], label: string) {
  const lower = text.toLowerCase();
  const found = keywords.some((k) => lower.includes(k.toLowerCase()));
  if (!found) {
    throw new Error(
      `${label}: expected response to contain one of [${keywords.join(', ')}]\n  Got: "${text.slice(0, 200)}..."`
    );
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Mastra Memory - Feature Test Suite                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Resource: ${RESOURCE}\n`);

  for (const t of tests) {
    const start = Date.now();
    try {
      await t.fn();
      const ms = Date.now() - start;
      console.log(`  PASS  ${t.name} (${ms}ms)`);
      passed++;
    } catch (err: any) {
      const ms = Date.now() - start;
      console.log(`  FAIL  ${t.name} (${ms}ms)`);
      console.log(`        ${err.message}\n`);
      failed++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed, ${tests.length} total`);
  console.log('─'.repeat(60));

  if (failed > 0) process.exit(1);
}

// ── Tests ────────────────────────────────────────────────

// ---------- 1. WORKING MEMORY ----------

test('Working Memory: stores user name', async () => {
  const thread = newThread();
  await chat(thread, "Hi, my name is Jordan and I'm a frontend developer.");
  // New thread - ask if it remembers
  const thread2 = newThread();
  const reply = await chat(thread2, 'What is my name?');
  assertContainsAny(reply, ['Jordan'], 'Should recall name "Jordan"');
});

test('Working Memory: stores user role', async () => {
  const thread = newThread();
  const reply = await chat(thread, 'What do you know about my job?');
  assertContainsAny(reply, ['frontend', 'developer'], 'Should recall role');
});

test('Working Memory: stores preferences', async () => {
  const thread = newThread();
  await chat(thread, 'I prefer very detailed, technical explanations. Add that to my preferences.');
  const thread2 = newThread();
  const reply = await chat(thread2, 'How do I prefer my responses?');
  assertContainsAny(reply, ['detailed', 'technical'], 'Should recall communication preference');
});

test('Working Memory: persists across multiple new threads', async () => {
  // At this point working memory should have: Jordan, frontend dev, detailed prefs
  const thread = newThread();
  const reply = await chat(thread, 'Give me a quick summary of everything you know about me.');
  assertContainsAny(reply, ['Jordan'], 'Should still know name');
  assertContainsAny(reply, ['frontend', 'developer'], 'Should still know role');
});

// ---------- 2. SEMANTIC RECALL ----------

test('Semantic Recall: finds relevant past messages by meaning', async () => {
  const thread = newThread();
  // Seed a specific fact in a conversation
  await chat(thread, 'We decided to use Tailwind CSS v4 for the design system migration.');

  // Different thread, ask about it differently (not exact wording)
  const thread2 = newThread();
  const reply = await chat(thread2, 'What CSS framework did we pick for the design system?');
  assertContainsAny(reply, ['Tailwind', 'tailwind'], 'Should recall Tailwind via semantic search');
});

test('Semantic Recall: finds context from earlier threads', async () => {
  const thread = newThread();
  await chat(thread, 'The API rate limit for our production tier is 10,000 requests per minute.');

  const thread2 = newThread();
  const reply = await chat(thread2, 'What was the rate limit we discussed?');
  assertContainsAny(reply, ['10,000', '10000', 'ten thousand'], 'Should recall rate limit');
});

// ---------- 3. TOOL USE + MEMORY COMBO ----------

test('Tool Use: lookupClient returns data', async () => {
  const thread = newThread();
  const reply = await chat(thread, 'Can you look up Startup Labs for me?');
  assertContainsAny(reply, ['Startup Labs', 'Alice Chen', 'Starter', 'Landing Page'], 'Should return client data');
});

test('Tool Use: createTask works', async () => {
  const thread = newThread();
  const reply = await chat(thread, 'Create a high priority task called "Deploy staging environment" assigned to Jordan.');
  assertContainsAny(reply, ['Deploy staging', 'TASK-', 'created', 'Jordan'], 'Should confirm task creation');
});

test('Tool + Memory: remembers tool results in later threads', async () => {
  // We looked up Startup Labs above - does the agent remember?
  const thread = newThread();
  const reply = await chat(thread, 'What do you know about Startup Labs from our previous conversation?');
  assertContainsAny(reply, ['Startup Labs', 'Alice', 'Landing Page', 'Starter'], 'Should recall client lookup from memory');
});

// ---------- 4. USER ISOLATION ----------

test('User Isolation: different resource gets clean slate', async () => {
  const isolatedResource = `isolated-user-${Date.now()}`;
  const thread = `isolated-thread-${Date.now()}`;
  const response = await agent.generate('What is my name?', {
    memory: { resource: isolatedResource, thread },
  });
  const reply = response.text.toLowerCase();
  // Should NOT know "Jordan" - that belongs to the other resource
  const leaks = reply.includes('jordan');
  assert(!leaks, 'Isolated user should NOT see another user\'s working memory');
});

// ---------- 5. MESSAGE HISTORY ----------

test('Message History: maintains conversation flow within a thread', async () => {
  const thread = newThread();
  await chat(thread, 'The three colors I like are red, green, and blue.');
  await chat(thread, 'Actually, swap green for purple.');
  const reply = await chat(thread, 'What are my three colors?');
  assertContainsAny(reply, ['purple'], 'Should reflect the correction within the thread');
  assertContainsAny(reply, ['red'], 'Should still remember red');
  assertContainsAny(reply, ['blue'], 'Should still remember blue');
});

// ── Run ──────────────────────────────────────────────────

runTests().catch(console.error);
