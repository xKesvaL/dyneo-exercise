import { test as base, expect } from "@playwright/test";

const API = "http://localhost:4010";

export type WireLog = {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warning" | "error" | "critical";
  service: string | null;
  message: string;
  duration_ms?: number | null;
  metadata: Record<string, unknown>;
};

let counter = 0;

export const makeLog = (overrides: Partial<WireLog> = {}): WireLog => {
  counter += 1;
  return {
    id: `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
    timestamp: "2026-10-06T10:15:30.000Z",
    level: "info",
    service: "user-service",
    message: `Log number ${counter}`,
    duration_ms: 120,
    metadata: {},
    ...overrides,
  };
};

class MockApi {
  private async post(path: string, body: unknown = {}) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Mock API ${path} failed: ${res.status}`);
  }

  reset() {
    return this.post("/__test/reset");
  }

  // Stored (so later connections get them as tail) and pushed to live clients.
  emit(...entries: WireLog[]) {
    return this.post("/__test/entries", { entries });
  }

  // Pushed as-is to live clients, to simulate corrupted entries.
  emitRaw(...raw: string[]) {
    return this.post("/__test/entries", { raw });
  }

  refuse(refuse: boolean) {
    return this.post("/__test/refuse", { refuse });
  }

  async requests(): Promise<string[]> {
    return (await fetch(`${API}/__test/requests`)).json();
  }
}

export const test = base.extend<{ api: MockApi }>({
  api: [
    // Playwright requires the fixtures argument to be a destructuring pattern.
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const api = new MockApi();
      await api.reset();
      await use(api);
    },
    { auto: true },
  ],
});

export { expect };
