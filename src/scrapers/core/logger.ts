import type { LogMeta, ScraperLogger } from "../types";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogLevel(): LogLevel {
  const candidate = process.env.SCRAPE_LOG_LEVEL?.toLowerCase();

  if (
    candidate === "debug" ||
    candidate === "info" ||
    candidate === "warn" ||
    candidate === "error"
  ) {
    return candidate;
  }

  return "info";
}

function serializeMeta(meta: LogMeta | undefined) {
  if (!meta) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => {
      if (value instanceof Error) {
        return [
          key,
          {
            message: value.message,
            stack: value.stack,
          },
        ];
      }

      return [key, value];
    }),
  );
}

export function createLogger(scope: string): ScraperLogger {
  const minimumLevel = resolveLogLevel();

  function emit(level: LogLevel, message: string, meta?: LogMeta) {
    if (LOG_LEVEL_WEIGHT[level] < LOG_LEVEL_WEIGHT[minimumLevel]) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      scope,
      message,
      ...serializeMeta(meta),
    };

    const serialized = JSON.stringify(payload);

    if (level === "error") {
      console.error(serialized);
      return;
    }

    console.log(serialized);
  }

  return {
    child(childScope: string) {
      return createLogger(`${scope}:${childScope}`);
    },
    debug(message: string, meta?: LogMeta) {
      emit("debug", message, meta);
    },
    info(message: string, meta?: LogMeta) {
      emit("info", message, meta);
    },
    warn(message: string, meta?: LogMeta) {
      emit("warn", message, meta);
    },
    error(message: string, meta?: LogMeta) {
      emit("error", message, meta);
    },
  };
}