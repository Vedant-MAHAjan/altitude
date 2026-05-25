import "server-only";

/**
 * Server-side environment variable validation.
 * Imported lazily by data layers — never bundled into client code.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Add it to your .env file or Vercel project settings.`,
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  /** Neon PostgreSQL pooled connection string */
  get DATABASE_URL() {
    return process.env.DATABASE_URL ?? "";
  },

  /** Public-facing site URL (used for canonical links, OG tags, sitemap) */
  get SITE_URL() {
    return optionalEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  },

  /** Secret for revalidation webhook (optional in dev) */
  get CRON_REVALIDATE_SECRET() {
    return process.env.CRON_REVALIDATE_SECRET ?? "";
  },

  /** Whether the app has a working database connection */
  get hasDatabase() {
    return Boolean(process.env.DATABASE_URL);
  },
} as const;
