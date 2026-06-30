// ============================================================
// Hospital Covadonga — Database Connection Pool
// ============================================================

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Self-migration to add Admin capability and seed the requested admin account
pool.query(`
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;
  INSERT INTO usuarios (nombre_completo, telefono, es_admin)
  VALUES ('Roberto Herrera Zetina', '2741119206', TRUE)
  ON CONFLICT (telefono) DO UPDATE SET es_admin = TRUE, nombre_completo = EXCLUDED.nombre_completo;
`).catch((err) => {
  console.error("Advertencia de migración automática de base de datos:", err);
});

/**
 * Execute a parameterized SQL query.
 * Always use $1, $2... placeholders to prevent SQL injection.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a query that returns a single row (or null).
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export default pool;
