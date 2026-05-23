import { spawn } from "node:child_process";

function isPlaceholderDatabaseUrl(rawValue) {
  if (typeof rawValue !== "string") {
    return true;
  }

  const value = rawValue.trim();

  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const username = decodeURIComponent(url.username || "").toLowerCase();
    const password = decodeURIComponent(url.password || "").toLowerCase();

    return (
      hostname.includes("hostname") ||
      hostname.includes("example") ||
      hostname.startsWith("your-") ||
      hostname.includes("replace-me") ||
      username === "user" ||
      username.includes("your") ||
      username.includes("replace-me") ||
      password === "password" ||
      password.includes("your") ||
      password.includes("replace-me")
    );
  } catch {
    return true;
  }
}

for (const fileName of [".env.local", ".env"]) {
  if (process.env.DATABASE_URL) {
    break;
  }

  try {
    process.loadEnvFile(fileName);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;

    if (code !== "ENOENT") {
      throw error;
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    [
      "DATABASE_URL is not set.",
      "Add your Neon PostgreSQL connection string to .env or .env.local before running database-backed commands.",
    ].join("\n"),
  );

  process.exit(1);
}

if (isPlaceholderDatabaseUrl(process.env.DATABASE_URL)) {
  console.error(
    [
      "DATABASE_URL looks like a placeholder or template value.",
      "Replace it with a real Neon pooled connection string before running db:sync, db:push, or scrape.",
      "If you only want to start the UI, run npm run dev without database-backed commands.",
    ].join("\n"),
  );

  process.exit(1);
}

if (process.argv.length > 2) {
  const [command, ...args] = process.argv.slice(2);

  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}