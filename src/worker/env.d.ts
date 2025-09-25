interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(options?: unknown): Promise<T | null>;
  all<T = unknown>(options?: unknown): Promise<{ results: T[] }>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch?<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  dump?(): Promise<ArrayBuffer>;
}

interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  CLERK_SECRET_KEY: string;
  PLUGGY_CLIENT_ID: string;
  PLUGGY_CLIENT_SECRET: string;
}
