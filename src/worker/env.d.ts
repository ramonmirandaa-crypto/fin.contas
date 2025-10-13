import type {
  D1Database as CloudflareD1Database,
  D1PreparedStatement as CloudflareD1PreparedStatement,
} from '@cloudflare/workers-types';

declare global {
  interface D1PreparedStatement extends CloudflareD1PreparedStatement {}

  interface D1Database extends CloudflareD1Database {}

  interface Env {
    DB: D1Database;
    OPENAI_API_KEY: string;
    CLERK_SECRET_KEY: string;
    PLUGGY_CLIENT_ID: string;
    PLUGGY_CLIENT_SECRET: string;
  }
}

export {};
