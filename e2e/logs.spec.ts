import { expect, makeLog, test } from "./fixtures";

test.describe("live feed", () => {
  test("shows the existing entries once connected", async ({ page, api }) => {
    await api.emit(
      makeLog({ message: "Order created", level: "info" }),
      makeLog({ message: "Payment declined", level: "error", service: "payment-service" }),
    );
    await page.goto("/");

    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible();
    await expect(page.getByText("Order created")).toBeVisible();
    await expect(page.getByText("Payment declined")).toBeVisible();
    await expect(page.getByText("Showing 2 entries")).toBeVisible();
  });

  test("asks the API for the last 500 entries", async ({ page, api }) => {
    await page.goto("/");
    await expect(page.getByText("Nothing to show yet")).toBeVisible();

    expect(await api.requests()).toEqual(["/logs/stream?tail=500"]);
  });

  test("shows new entries as they stream in", async ({ page, api }) => {
    await api.emit(makeLog({ message: "First entry" }));
    await page.goto("/");
    await expect(page.getByText("Showing 1 entry")).toBeVisible();

    await api.emit(makeLog({ message: "Streamed entry", level: "warning" }));

    await expect(page.getByText("Streamed entry")).toBeVisible();
    await expect(page.getByText("Showing 2 entries")).toBeVisible();
  });

  test("keeps at most 1,000 entries", async ({ page, api }) => {
    await page.goto("/");
    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible();

    await api.emit(...Array.from({ length: 1100 }, (_, i) => makeLog({ message: `Bulk ${i}` })));

    await expect(page.getByText("Showing 1,000 entries")).toBeVisible();
    await expect(page.getByText("Bulk 1099", { exact: true })).toBeVisible();
  });

  test("shows an empty state while nothing has happened", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Nothing to show yet")).toBeVisible();
    await expect(page.getByText("Showing 0 entries")).toBeVisible();
  });

  test("skips entries that cannot be read and says so", async ({ page, api }) => {
    await page.goto("/");
    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible();

    await api.emitRaw("not json", JSON.stringify({ id: "x", level: "nope" }));
    await api.emit(makeLog({ message: "Valid entry" }));

    await expect(page.getByText("Valid entry")).toBeVisible();
    await expect(page.getByText("Showing 1 entry")).toBeVisible();
    await expect(page.getByText("Skipped 2 entries that couldn’t be read")).toBeVisible();
  });
});

test.describe("entry details", () => {
  const entry = () =>
    makeLog({
      message: "Charge failed",
      level: "error",
      service: "payment-service",
      duration_ms: 2500,
      metadata: { request_id: "abc123", user_id: 42, http_status: 500 },
    });

  test("shows a readable summary line", async ({ page, api }) => {
    await api.emit(entry());
    await page.goto("/");

    const row = page.getByRole("listitem").filter({ hasText: "Charge failed" });
    await expect(row.getByText("10:15:30")).toBeVisible();
    await expect(row.getByText("Payment service")).toBeVisible();
    await expect(row.getByText("Error", { exact: true })).toBeVisible();
  });

  test("reveals the details of a line on click", async ({ page, api }) => {
    await api.emit(entry());
    await page.goto("/");
    const row = page.getByRole("listitem").filter({ hasText: "Charge failed" });
    await expect(row.getByText("Something failed and needs attention.")).toBeHidden();

    await row.getByRole("button", { name: /Charge failed/ }).click();

    await expect(row.getByText("Something failed and needs attention.")).toBeVisible();
    await expect(row.getByText("06/10/2026 10:15:30")).toBeVisible();
    await expect(row.getByText("2.5 seconds")).toBeVisible();
    await expect(row.getByText("Server error (500)")).toBeVisible();
    await expect(row.getByText("abc123")).toBeVisible();
    await expect(row.getByText("42", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: /Charge failed/ }).click();
    await expect(row.getByText("Something failed and needs attention.")).toBeHidden();
  });

  test("shows and hides the raw technical details", async ({ page, api }) => {
    await api.emit(entry());
    await page.goto("/");
    const row = page.getByRole("listitem").filter({ hasText: "Charge failed" });
    await row.getByRole("button", { name: /Charge failed/ }).click();

    await row.getByRole("button", { name: "Show technical details" }).click();
    await expect(row.locator("pre")).toContainText('"duration_ms": 2500');
    await expect(row.locator("pre")).toContainText('"request_id": "abc123"');

    await row.getByRole("button", { name: "Hide technical details" }).click();
    await expect(row.locator("pre")).toBeHidden();
  });

  test("copies the raw entry for support", async ({ page, api, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const log = entry();
    await api.emit(log);
    await page.goto("/");
    const row = page.getByRole("listitem").filter({ hasText: "Charge failed" });
    await row.getByRole("button", { name: /Charge failed/ }).click();

    await row.getByRole("button", { name: "Copy for support" }).click();

    await expect(row.getByRole("button", { name: "Copied" })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(JSON.parse(copied)).toEqual(log);
  });
});

test.describe("level filter", () => {
  const levels = ["debug", "info", "warning", "error", "critical"] as const;

  test.beforeEach(async ({ page, api }) => {
    await api.emit(...levels.map((level) => makeLog({ level, message: `A ${level} message` })));
    await page.goto("/");
    await expect(page.getByText("Showing 5 entries")).toBeVisible();
  });

  test("selecting several levels shows only those", async ({ page }) => {
    await page.getByRole("combobox", { name: "Show" }).click();
    await page.getByRole("option", { name: "Error" }).click();
    await page.getByRole("option", { name: "Critical" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("Showing 2 entries")).toBeVisible();
    await expect(page.getByText("A error message")).toBeVisible();
    await expect(page.getByText("A critical message")).toBeVisible();
    await expect(page.getByText("A info message")).toBeHidden();
    await expect(page.getByRole("combobox", { name: "Show" })).toContainText("Error, Critical");
  });

  test("selecting a single level lets the API filter it", async ({ page, api }) => {
    await page.getByRole("combobox", { name: "Show" }).click();
    await page.getByRole("option", { name: "Warning" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("Showing 1 entry")).toBeVisible();
    await expect(page.getByText("A warning message")).toBeVisible();
    await expect.poll(() => api.requests()).toContain("/logs/stream?tail=500&level=warning");
  });

  test("filters entries that stream in afterwards", async ({ page, api }) => {
    await page.getByRole("combobox", { name: "Show" }).click();
    await page.getByRole("option", { name: "Error" }).click();
    await page.getByRole("option", { name: "Critical" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Showing 2 entries")).toBeVisible();

    await api.emit(makeLog({ level: "info", message: "Hidden info" }));
    await api.emit(makeLog({ level: "critical", message: "Visible critical" }));

    await expect(page.getByText("Visible critical")).toBeVisible();
    await expect(page.getByText("Hidden info")).toBeHidden();
    await expect(page.getByText("Showing 3 entries")).toBeVisible();
  });

  test("“Show everything” clears the filter", async ({ page }) => {
    await page.getByRole("combobox", { name: "Show" }).click();
    await page.getByRole("option", { name: "Error" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Showing 1 entry")).toBeVisible();

    await page.getByRole("button", { name: "Show everything" }).click();

    await expect(page.getByText("Showing 5 entries")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Show" })).toContainText("Everything");
    await expect(page.getByRole("button", { name: "Show everything" })).toBeHidden();
  });

  test("explains when no entry matches the filter", async ({ page, api }) => {
    await api.reset();
    await page.reload();
    await api.emit(makeLog({ level: "info", message: "Only info" }));
    await expect(page.getByText("Only info")).toBeVisible();

    await page.getByRole("combobox", { name: "Show" }).click();
    await page.getByRole("option", { name: "Critical" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByText("No activity of the selected types so far.")).toBeVisible();
  });
});

test.describe("pause and resume", () => {
  test("freezes the list and counts what arrives meanwhile", async ({ page, api }) => {
    await api.emit(makeLog({ message: "Before pause" }));
    await page.goto("/");
    await expect(page.getByText("Before pause")).toBeVisible();

    await page.getByRole("button", { name: "Pause updates" }).click();
    await expect(page.getByText("Updates are paused.")).toBeVisible();
    await expect(page.getByText("Nothing new yet.")).toBeVisible();

    await api.emit(makeLog({ message: "During pause 1" }));
    await expect(page.getByText("1 new entry is waiting.")).toBeVisible();
    await api.emit(makeLog({ message: "During pause 2" }));
    await expect(page.getByText("2 new entries are waiting.")).toBeVisible();

    await expect(page.getByText("During pause 1")).toBeHidden();
    await expect(page.getByText("Showing 1 entry")).toBeVisible();
  });

  test("“Show latest” brings the waiting entries in", async ({ page, api }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pause updates" }).click();
    await api.emit(makeLog({ message: "Waiting entry" }));
    await expect(page.getByText("1 new entry is waiting.")).toBeVisible();

    await page.getByRole("button", { name: "Show latest" }).click();

    await expect(page.getByText("Waiting entry")).toBeVisible();
    await expect(page.getByText("Updates are paused.")).toBeHidden();
    await expect(page.getByRole("button", { name: "Pause updates" })).toBeVisible();
  });

  test("“Resume updates” in the header also resumes", async ({ page, api }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pause updates" }).click();
    await api.emit(makeLog({ message: "Waiting entry" }));

    await page.getByRole("button", { name: "Resume updates" }).click();

    await expect(page.getByText("Waiting entry")).toBeVisible();
    await expect(page.getByText("Updates are paused.")).toBeHidden();
  });

  test("scrolling up pauses, and “Jump to latest” appears while following", async ({
    page,
    api,
  }) => {
    await api.emit(...Array.from({ length: 60 }, (_, i) => makeLog({ message: `Row ${i}` })));
    await page.goto("/");
    await expect(page.getByText("Row 59", { exact: true })).toBeInViewport();

    await page.getByText("Row 0", { exact: true }).scrollIntoViewIfNeeded();
    const jump = page.getByRole("button", { name: "Jump to latest" });
    await expect(jump).toBeVisible();

    await jump.click();
    await expect(page.getByText("Row 59", { exact: true })).toBeInViewport();
    await expect(jump).toBeHidden();
  });
});

test.describe("connection status", () => {
  test("goes offline after the retries are exhausted, then recovers on demand", async ({
    page,
    api,
  }) => {
    await api.emit(makeLog({ message: "Recovered entry" }));
    await api.refuse(true);
    await page.clock.install();
    await page.goto("/");

    await expect(page.getByRole("status").filter({ hasText: "Reconnecting…" })).toBeVisible();
    for (const delay of [3_000, 10_000, 30_000]) {
      await page.clock.fastForward(delay);
      await page.waitForTimeout(300);
    }

    await expect(page.getByRole("status").filter({ hasText: "Offline" })).toBeVisible();
    await expect(page.getByText("We lost the connection")).toBeVisible();

    await api.refuse(false);
    await page.getByRole("button", { name: "Try again" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible();
    await expect(page.getByText("We lost the connection")).toBeHidden();
    await expect(page.getByText("Recovered entry")).toBeVisible();
  });

  test("“Reconnect now” skips the wait while reconnecting", async ({ page, api }) => {
    await api.emit(makeLog({ message: "Back online" }));
    await api.refuse(true);
    await page.goto("/");
    await expect(page.getByRole("status").filter({ hasText: "Reconnecting…" })).toBeVisible();

    await api.refuse(false);
    await page.getByRole("button", { name: "Reconnect now" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Live" })).toBeVisible();
    await expect(page.getByText("Back online")).toBeVisible();
  });
});
