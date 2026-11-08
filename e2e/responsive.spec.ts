import { expect, test } from "@playwright/test";

test("no horizontal overflow on mobile", async ({ page }) => {
  for (const url of ["/", "/fa", "/events/view?id=e1", "/tickets", "/checkout?id=e3", "/events/create"]) {
    await page.goto(url);
    await page.waitForTimeout(600);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, url).toBeLessThanOrEqual(1);
  }
});
