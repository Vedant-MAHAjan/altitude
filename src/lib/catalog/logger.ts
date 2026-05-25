export type CatalogLogMeta = Record<string, unknown>;

export type CatalogLogger = {
  child(scope: string): CatalogLogger;
  debug(message: string, meta?: CatalogLogMeta): void;
  info(message: string, meta?: CatalogLogMeta): void;
  warn(message: string, meta?: CatalogLogMeta): void;
  error(message: string, meta?: CatalogLogMeta): void;
};

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogLevel(): LogLevel {
  const candidate =
    process.env.CATALOG_LOG_LEVEL?.toLowerCase() ??
    process.env.SCRAPE_LOG_LEVEL?.toLowerCase();

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

function serializeMeta(meta: CatalogLogMeta | undefined) {
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

export function createCatalogLogger(scope: string): CatalogLogger {
  const minimumLevel = resolveLogLevel();

  function emit(level: LogLevel, message: string, meta?: CatalogLogMeta) {
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
      return createCatalogLogger(`${scope}:${childScope}`);
    },
    debug(message: string, meta?: CatalogLogMeta) {
      emit("debug", message, meta);
    },
    info(message: string, meta?: CatalogLogMeta) {
      emit("info", message, meta);
    },
    warn(message: string, meta?: CatalogLogMeta) {
      emit("warn", message, meta);
    },
    error(message: string, meta?: CatalogLogMeta) {
      emit("error", message, meta);
    },
  };
}