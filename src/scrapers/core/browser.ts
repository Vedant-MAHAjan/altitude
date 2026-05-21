import { chromium, type Page } from "playwright";

import type { ScraperLogger } from "../types";

export async function withChromiumPage<T>(
  userAgent: string,
  work: (page: Page) => Promise<T>,
) {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext({
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    userAgent,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(45_000);

  try {
    return await work(page);
  } finally {
    await context.close();
    await browser.close();
  }
}

export async function gotoAndSettle(
  page: Page,
  url: string,
  logger?: ScraperLogger,
  timeout = 45_000,
) {
  logger?.debug("Navigating", { url });

  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout,
  });

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {
    logger?.debug("Network idle timeout ignored", { url });
  });
}