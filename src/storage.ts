/**
 * Storage configuration for Mastra persistent memory.
 *
 * Uses LibSQL (SQLite-compatible) for local development.
 * Swap to @mastra/pg for production PostgreSQL.
 */
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';

// Persistent local storage - survives across restarts
export const store = new LibSQLStore({
  url: 'file:./mastra-memory.db',
});

// Vector store for semantic recall (embedding search over past messages)
export const vectorStore = new LibSQLVector({
  connectionUrl: 'file:./mastra-vectors.db',
});
