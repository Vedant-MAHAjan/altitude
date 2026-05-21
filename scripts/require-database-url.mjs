import { spawn } from "node:child_process";

for (const fileName of [".env.local", ".env", ".env.example"]) {
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
      "Add your Neon PostgreSQL connection string to .env, .env.local, or as a fallback .env.example before running database-backed commands.",
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