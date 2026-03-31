/**
 * Demo tools that showcase how Mastra agents use tools alongside memory.
 */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Simulates looking up a client in a CRM.
 * In production, this would hit a real API.
 */
export const lookupClientTool = createTool({
  id: 'lookup-client',
  description: 'Look up a client by name and return their account details',
  inputSchema: z.object({
    clientName: z.string().describe('The client name to search for'),
  }),
  outputSchema: z.object({
    found: z.boolean(),
    client: z.object({
      name: z.string(),
      plan: z.string(),
      monthlyBudget: z.number(),
      activeProjects: z.array(z.string()),
      primaryContact: z.string(),
    }).optional(),
  }),
  execute: async ({ context }) => {
    // Simulated CRM data
    const clients: Record<string, any> = {
      'acme corp': {
        name: 'Acme Corp',
        plan: 'Enterprise',
        monthlyBudget: 15000,
        activeProjects: ['Website Redesign', 'SEO Campaign', 'PPC Management'],
        primaryContact: 'Jane Smith (jane@acme.com)',
      },
      'widget co': {
        name: 'Widget Co',
        plan: 'Professional',
        monthlyBudget: 5000,
        activeProjects: ['Local SEO', 'Google Ads'],
        primaryContact: 'Bob Jones (bob@widgetco.com)',
      },
      'startup labs': {
        name: 'Startup Labs',
        plan: 'Starter',
        monthlyBudget: 2000,
        activeProjects: ['Landing Page Build'],
        primaryContact: 'Alice Chen (alice@startuplabs.io)',
      },
    };

    const key = context.clientName.toLowerCase();
    const client = clients[key];

    return client
      ? { found: true, client }
      : { found: false };
  },
});

/**
 * Gets the current date/time - useful for the agent to timestamp things.
 */
export const getCurrentTimeTool = createTool({
  id: 'get-current-time',
  description: 'Get the current date and time',
  inputSchema: z.object({}),
  outputSchema: z.object({
    datetime: z.string(),
    timezone: z.string(),
  }),
  execute: async () => ({
    datetime: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
});

/**
 * Simulates creating a task/todo item.
 */
export const createTaskTool = createTool({
  id: 'create-task',
  description: 'Create a new task or action item with a title and optional due date',
  inputSchema: z.object({
    title: z.string().describe('The task title'),
    assignee: z.string().optional().describe('Who to assign this to'),
    dueDate: z.string().optional().describe('Due date in ISO format'),
    priority: z.enum(['low', 'medium', 'high']).optional().describe('Task priority'),
  }),
  outputSchema: z.object({
    taskId: z.string(),
    created: z.boolean(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const taskId = `TASK-${Date.now().toString(36).toUpperCase()}`;
    const parts = [`Created "${context.title}"`];
    if (context.assignee) parts.push(`assigned to ${context.assignee}`);
    if (context.dueDate) parts.push(`due ${context.dueDate}`);
    if (context.priority) parts.push(`priority: ${context.priority}`);

    return {
      taskId,
      created: true,
      summary: parts.join(', '),
    };
  },
});
