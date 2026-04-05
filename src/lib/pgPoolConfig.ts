import type { PoolConfig } from "pg";

/**
 * `pg` v8 treats `sslmode=require` in the URL like verify-full, which ignores
 * `ssl: { rejectUnauthorized: false }`. Strip it when we supply explicit ssl.
 */
function connectionStringWithoutSslMode(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Node's TLS stack sometimes rejects Supabase's cert chain on Windows ("self-signed certificate in certificate chain").
 * Supabase still uses TLS; this only skips CA verification (common for cloud Postgres from local dev).
 *
 * Set DATABASE_SSL_NO_VERIFY=false to force strict verification.
 * Set DATABASE_SSL_NO_VERIFY=true to relax SSL for any host (e.g. other providers).
 */
export function pgPoolConfig(connectionString: string): PoolConfig {
  const strict = process.env.DATABASE_SSL_NO_VERIFY === "false";
  const forceRelax = process.env.DATABASE_SSL_NO_VERIFY === "true";
  const supabase = /\.supabase\.co\b/i.test(connectionString);

  if (!strict && (forceRelax || supabase)) {
    return {
      connectionString: connectionStringWithoutSslMode(connectionString),
      ssl: { rejectUnauthorized: false },
    };
  }

  return { connectionString };
}
