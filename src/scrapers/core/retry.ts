type RetryOptions = {
  attempts?: number;
  minDelayMs?: number;
};

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function withRetry<T>(
  task: () => Promise<T>,
  options: RetryOptions = {},
) {
  const attempts = options.attempts ?? 3;
  const minDelayMs = options.minDelayMs ?? 500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      await wait(minDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}