import type { D1RunResult } from '../types';

const USER_CONFIG_INSERT_SQL = `
  INSERT INTO user_configs (user_id, config_key, config_value, created_at, updated_at)
  VALUES (?, ?, ?, datetime('now'), datetime('now'))
`;

const USER_CONFIG_UPDATE_SQL = `
  UPDATE user_configs
  SET config_value = ?, updated_at = datetime('now')
  WHERE user_id = ? AND config_key = ?
`;

export const getUserConfigValue = async (
  db: D1Database,
  userId: string,
  configKey: string,
): Promise<string | null> => {
  const stmt = db.prepare('SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = ?');
  const result = await stmt.bind(userId, configKey).first() as { config_value?: string } | null;
  return result?.config_value ?? null;
};

export const upsertUserConfigValue = async (
  db: D1Database,
  userId: string,
  configKey: string,
  value: string,
) => {
  try {
    const updateResult = await db.prepare(USER_CONFIG_UPDATE_SQL)
      .bind(value, userId, configKey)
      .run() as D1RunResult;

    const changes = updateResult.meta?.changes ?? 0;
    if (changes && changes > 0) {
      return;
    }
  } catch (error) {
    console.warn('Failed to update user config, attempting insert instead:', error);
  }

  await db.prepare(USER_CONFIG_INSERT_SQL)
    .bind(userId, configKey, value)
    .run();
};
