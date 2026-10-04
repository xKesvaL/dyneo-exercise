import { describe, expect, it } from "vite-plus/test";
import { MAX_ENTRIES, type LogEntry } from "./config";
import { initialLogState, isFollowing, logReducer, visibleEntries } from "./log-reducer";

const entry = (id: string): LogEntry => ({
  id,
  timestamp: "2024-01-01T00:00:00.000Z",
  date: new Date("2024-01-01T00:00:00.000Z"),
  level: "info",
  message: id,
  service: null,
  durationMs: null,
  metadata: {},
  raw: null,
});

const received = (id: string) => ({ type: "received", entry: entry(id) }) as const;

describe("logReducer", () => {
  it("appends entries in arrival order", () => {
    let s = logReducer(initialLogState, received("a"));
    s = logReducer(s, received("b"));
    expect(s.entries.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("returns the same state for a duplicate id", () => {
    const s = logReducer(initialLogState, received("a"));
    expect(logReducer(s, received("a"))).toBe(s);
  });

  it("drops from the front beyond MAX_ENTRIES", () => {
    let s = initialLogState;
    for (let i = 0; i < MAX_ENTRIES + 5; i++) s = logReducer(s, received(String(i)));
    expect(s.entries).toHaveLength(MAX_ENTRIES);
    expect(s.entries[0].id).toBe("5");
  });

  it("counts malformed events", () => {
    const s = logReducer(logReducer(initialLogState, { type: "malformed" }), { type: "malformed" });
    expect(s.ignored).toBe(2);
  });

  it("pauses with a snapshot and counts new entries", () => {
    let s = logReducer(initialLogState, received("a"));
    s = logReducer(s, { type: "pause" });
    expect(s.snapshot).toBe(s.entries);
    expect(isFollowing(s)).toBe(false);

    s = logReducer(s, received("b"));
    expect(s.newWhilePaused).toBe(1);
    expect(visibleEntries(s).map((e) => e.id)).toEqual(["a"]);
    expect(s.entries.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("does not count duplicates while paused", () => {
    let s = logReducer(logReducer(initialLogState, received("a")), { type: "pause" });
    s = logReducer(s, received("a"));
    expect(s.newWhilePaused).toBe(0);
  });

  it("pause is a no-op when already paused", () => {
    let s = logReducer(initialLogState, { type: "pause" });
    s = logReducer(s, received("a"));
    expect(logReducer(s, { type: "pause" })).toBe(s);
  });

  it("resume clears snapshot and count", () => {
    let s = logReducer(initialLogState, { type: "pause" });
    s = logReducer(s, received("a"));
    s = logReducer(s, { type: "resume" });
    expect(s.snapshot).toBeNull();
    expect(s.newWhilePaused).toBe(0);
    expect(isFollowing(s)).toBe(true);
    expect(visibleEntries(s).map((e) => e.id)).toEqual(["a"]);
  });
});
