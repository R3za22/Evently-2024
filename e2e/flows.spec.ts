import { expect, test } from "@playwright/test";

const origin = "http://localhost:3100";
test.beforeEach(async ({ page }) => {
  const external: string[] = [];
  (page as any)._external = external;
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith("data:") && !u.startsWith("blob:")) external.push(u);
  });
});
test.afterEach(async ({ page }) => {
  expect((page as any)._external, "no request leaves the origin").toEqual([]);
});

test("discover: search, filter, paginate, empty state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("event-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByTestId("event-card")).toHaveCount(6);
  await page.getByLabel("Search events by title").fill("jazz");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByTestId("event-card")).toHaveCount(1);
  await page.getByLabel("Search events by title").fill("zzzz");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No events found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByTestId("event-card")).toHaveCount(6);
  await page.getByLabel("Category", { exact: true }).selectOption({ label: "Technology" });
  await expect(page.getByTestId("event-card")).toHaveCount(2);
});

test("discover shows an error state with retry", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("evently.mock.fail", "events"));
  await page.reload();
  await expect(page.getByText("Couldn't load events")).toBeVisible();
  await page.evaluate(() => localStorage.removeItem("evently.mock.fail"));
  await page.getByRole("button", { name: /try again/i }).click();
  await expect(page.getByTestId("event-card").first()).toBeVisible();
});

test("event detail shows related events", async ({ page }) => {
  await page.goto("/events/view?id=e2");
  await expect(page.getByRole("heading", { name: "React & Next.js Meetup" })).toBeVisible();
  await expect(page.getByText("Related events")).toBeVisible();
  await page.goto("/events/view?id=nope");
  await expect(page.getByText("Event not found")).toBeVisible();
});

test("checkout: declined card then success, ticket appears", async ({ page }) => {
  await page.goto("/checkout?id=e3");
  const fill = async (num: string) => {
    await page.getByLabel("Name on card").fill("Demo User");
    await page.getByLabel("Card number").fill(num);
    await page.getByLabel(/Expiry/).fill("12/30");
    await page.getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: /pay/i }).click();
  };
  await fill("4000 0000 0000 0002");
  await expect(page.getByTestId("payment-declined")).toBeVisible();
  await page.getByLabel("Card number").fill("4242 4242 4242 4242");
  await page.getByRole("button", { name: /pay/i }).click();
  await expect(page.getByTestId("checkout-success")).toBeVisible();
  await page.goto("/tickets");
  await expect(page.getByTestId("ticket-row")).toHaveCount(3);
});

test("create, edit and delete an event with validation + mock upload", async ({ page }) => {
  await page.goto("/events/create");
  await page.getByRole("button", { name: "Create event" }).click();
  await expect(page.locator(".hint").first()).toBeVisible();
  await page.getByLabel("Event title").fill("E2E Launch Party");
  await page.getByLabel("Category", { exact: true }).selectOption({ label: "Music" });
  await page.getByLabel("Location").fill("Rooftop Lounge");
  await page.getByLabel("Price").fill("-5");
  await page.getByLabel("Event image").setInputFiles({
    name: "cover.svg", mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'),
  });
  await page.getByRole("button", { name: "Create event" }).click();
  await expect(page.getByText("Price can't be negative.")).toBeVisible();
  await page.getByLabel("Price").fill("12");
  await page.getByRole("button", { name: "Create event" }).click();
  await expect(page.getByRole("heading", { name: "E2E Launch Party" })).toBeVisible();
  await page.getByRole("link", { name: "Edit event" }).click();
  await page.getByLabel("Event title").fill("E2E Launch Party v2");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "E2E Launch Party v2" })).toBeVisible();
  await page.getByRole("button", { name: "Delete event" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("tickets: attending and organised; organiser orders with search", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page.getByTestId("ticket-row")).toHaveCount(2);
  await page.getByTestId("tab-organised").click();
  await expect(page.getByTestId("event-card")).toHaveCount(2);
  await page.getByRole("link", { name: "View orders" }).first().click();
  await expect(page.getByTestId("order-row")).toHaveCount(5);
  await page.getByLabel("Search by buyer name").fill("mina");
  await expect(page.getByTestId("order-row")).toHaveCount(1);
});

test("sign out, protected redirect, sign in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/tickets");
  await expect(page).toHaveURL(/sign-in\?next=/);
  await page.getByLabel("Password").fill("anything");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/tickets/);
  await expect(page.getByRole("heading", { name: "My tickets" })).toBeVisible();
});

test("Persian RTL home", async ({ page }) => {
  await page.goto("/fa");
  await expect(page.locator('[dir="rtl"]').first()).toBeVisible();
  await expect(page.getByText("رویدادهای پیش رو")).toBeVisible();
  await expect(page.getByTestId("event-card")).toHaveCount(6);
});

test("404 page", async ({ page }) => {
  await page.goto("/nope");
  await expect(page.getByText("This ticket doesn’t exist.")).toBeVisible();
});
