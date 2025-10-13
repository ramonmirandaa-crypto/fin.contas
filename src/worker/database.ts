import type { D1Database } from '@cloudflare/workers-types';

const splitSqlStatements = (input: string): string[] => {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let pendingTriggerBody = false;
  let triggerBodyDepth = 0;

  const isBoundary = (value: string, index: number, length: number) => {
    const before = value[index - 1];
    const after = value[index + length];
    const isBeforeBoundary = index === 0 || /[\s;(),]/.test(before ?? '');
    const isAfterBoundary =
      index + length >= value.length || /[\s;(),]/.test(after ?? '');

    return isBeforeBoundary && isAfterBoundary;
  };

  const pushStatement = () => {
    const trimmed = current.trim();
    if (!trimmed) {
      current = '';
      pendingTriggerBody = false;
      triggerBodyDepth = 0;
      return;
    }

    const withoutTerminator =
      trimmed.endsWith(';') ? trimmed.slice(0, -1).trimEnd() : trimmed;

    if (withoutTerminator) {
      statements.push(withoutTerminator);
    }

    current = '';
    pendingTriggerBody = false;
    triggerBodyDepth = 0;
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inLineComment) {
      current += char;

      if (char === '\n') {
        inLineComment = false;
      }

      continue;
    }

    if (inBlockComment) {
      current += char;

      if (char === '*' && next === '/') {
        current += '/';
        index += 1;
        inBlockComment = false;
      }

      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === '-' && next === '-') {
        current += char;
        current += next;
        index += 1;
        inLineComment = true;
        continue;
      }

      if (char === '/' && next === '*') {
        current += char;
        current += next;
        index += 1;
        inBlockComment = true;
        continue;
      }
    }

    if (char === '\'' && !inDoubleQuote) {
      current += char;

      if (input[index - 1] !== '\\') {
        inSingleQuote = !inSingleQuote;
      }

      continue;
    }

    if (char === '"' && !inSingleQuote) {
      current += char;

      if (input[index - 1] !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      }

      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      const remaining = input.slice(index).toUpperCase();

      if (!pendingTriggerBody && remaining.startsWith('CREATE TRIGGER') && isBoundary(input, index, 'CREATE TRIGGER'.length)) {
        pendingTriggerBody = true;
      }

      if (remaining.startsWith('BEGIN') && isBoundary(input, index, 5)) {
        if (pendingTriggerBody || triggerBodyDepth > 0) {
          triggerBodyDepth += 1;
          pendingTriggerBody = false;
        }
      } else if (remaining.startsWith('END') && isBoundary(input, index, 3)) {
        if (triggerBodyDepth > 0) {
          triggerBodyDepth = Math.max(0, triggerBodyDepth - 1);
          if (triggerBodyDepth === 0) {
            pendingTriggerBody = false;
          }
        }
      }
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && triggerBodyDepth === 0) {
      current += char;
      pushStatement();
      continue;
    }

    current += char;
  }

  pushStatement();

  return statements;
};

const MIGRATION_SOURCES = import.meta.glob('../../migrations/*.sql', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const normalizePathSeparators = (value: string): string => value.replace(/\\/g, '/');

const extractMigrationId = (filePath: string): string => {
  const normalized = normalizePathSeparators(filePath);
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1] ?? normalized;
  return fileName.replace(/\.sql$/i, '');
};


type Migration = {
  id: string;
  statements: readonly string[];
};

const MIGRATIONS: readonly Migration[] = (() => {
  const staged = Object.entries(MIGRATION_SOURCES).map(([filePath, sql]) => ({
    id: extractMigrationId(filePath),
    statements: splitSqlStatements(sql),
    filePath,
  }));

  staged.sort((left, right) => left.id.localeCompare(right.id));

  const seen = new Set<string>();
  const normalized: Migration[] = [];

  for (const entry of staged) {
    if (seen.has(entry.id)) {
      throw new Error(`Duplicate migration detected for id "${entry.id}" (${entry.filePath}).`);
    }

    seen.add(entry.id);

    if (entry.statements.length === 0) {
      continue;
    }

    normalized.push({ id: entry.id, statements: entry.statements });
  }

  if (normalized.length === 0) {
    throw new Error('No SQL migrations were bundled. Ensure the "migrations" directory contains at least one .sql file.');
  }

  return normalized;
})();

type Migration = {
  id: string;
  statements: readonly string[];
};

const MIGRATIONS: readonly Migration[] = [
  {
    id: '0001_initial_schema',
    statements: splitSqlStatements(INITIAL_SCHEMA_SQL),
  },
];

let schemaInitPromise: Promise<void> | null = null;

const runStatement = async (db: D1Database, statement: string) => {
  const result = await db.prepare(statement).run();

  if (!result.success) {
    throw new Error(`Failed to execute statement: ${statement}`);
  }
};

const applyMigration = async (db: D1Database, migration: Migration) => {
  const pragmaStatements: string[] = [];
  const transactionalStatements: string[] = [];

  for (const statement of migration.statements) {
    const normalized = statement.trim().toUpperCase();

    if (normalized.startsWith('PRAGMA')) {
      pragmaStatements.push(statement);
    } else {
      transactionalStatements.push(statement);
    }
  }

  for (const statement of pragmaStatements) {
    await runStatement(db, statement);
  }

  await db.exec('BEGIN TRANSACTION;');

  let lastStatement: string | null = null;

  try {
    for (const statement of transactionalStatements) {
      lastStatement = statement;
      await runStatement(db, statement);
    }

    await db
      .prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, CURRENT_TIMESTAMP)')
      .bind(migration.id)
      .run();

    await db.exec('COMMIT;');
  } catch (error) {
    await db.exec('ROLLBACK;');
    const detail =
      lastStatement !== null ? ` while executing "${lastStatement}"` : '';
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to apply migration ${migration.id}${detail}: ${reason}`,
      { cause: error instanceof Error ? error : undefined }
    );
  }
};

const ensureMigrationsTable = async (db: D1Database) => {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at DATETIME NOT NULL
    );`
  );
};

const getAppliedMigrations = async (db: D1Database): Promise<Set<string>> => {
  const result = await db.prepare('SELECT id FROM schema_migrations').all<{ id: string }>();
  const applied = new Set<string>();

  for (const row of result.results ?? []) {
    if (row?.id) {
      applied.add(row.id);
    }
  }

  return applied;
};

export const ensureDatabaseSchema = async (db: D1Database): Promise<void> => {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      await ensureMigrationsTable(db);
      const applied = await getAppliedMigrations(db);

      for (const migration of MIGRATIONS) {
        if (applied.has(migration.id)) {
          continue;
        }

        await applyMigration(db, migration);
      }
    })();

    schemaInitPromise.catch(() => {
      schemaInitPromise = null;
    });
  }

  return schemaInitPromise;
};
