// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { TAIL, type Level } from "@/lib/config";
import { useLogStream } from "./use-log-stream";

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  url: string;
  readyState: number = FakeEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn(() => {
    this.readyState = FakeEventSource.CLOSED;
  });

  constructor(url: string | URL) {
    this.url = String(url);
    FakeEventSource.instances.push(this);
  }

  emitOpen() {
    this.readyState = FakeEventSource.OPEN;
    act(() => this.onopen?.());
  }

  emitMessage(data: string) {
    act(() => this.onmessage?.({ data }));
  }

  emitError(readyState: number) {
    this.readyState = readyState;
    act(() => this.onerror?.());
  }
}

const logJson = (id: string) =>
  JSON.stringify({
    id,
    timestamp: "2026-10-04T12:00:00.000Z",
    date: "2026-10-04T12:00:00.000Z",
    level: "info",
    message: `message ${id}`,
    service: "api",
    durationMs: 42,
    metadata: {},
    raw: null,
  });

const render = (level: Level | "all" = "all") =>
  renderHook(({ level }) => useLogStream(level), { initialProps: { level } });

const lastInstance = () => FakeEventSource.instances.at(-1)!;

describe("useLogStream", () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("connection URL", () => {
    it("requests the tail and no level filter for 'all'", () => {
      render("all");

      expect(FakeEventSource.instances).toHaveLength(1);
      const url = new URL(lastInstance().url);
      expect(url.pathname).toBe("/logs/stream");
      expect(url.searchParams.get("tail")).toBe(String(TAIL));
      expect(url.searchParams.get("tail")).toBe("200");
      expect(url.searchParams.has("level")).toBe(false);
    });

    it("adds the level filter when a level is given", () => {
      render("error");

      const url = new URL(lastInstance().url);
      expect(url.searchParams.get("tail")).toBe("200");
      expect(url.searchParams.get("level")).toBe("error");
    });
  });

  describe("status", () => {
    it("starts connecting and becomes live on open", () => {
      const { result } = render();
      expect(result.current.status).toBe("connecting");

      lastInstance().emitOpen();

      expect(result.current.status).toBe("live");
    });

    it("is reconnecting when errored while the browser retries (CONNECTING)", () => {
      const { result } = render();
      lastInstance().emitOpen();

      lastInstance().emitError(FakeEventSource.CONNECTING);

      expect(result.current.status).toBe("reconnecting");
    });

    it("is closed when errored and the connection is CLOSED", () => {
      const { result } = render();
      lastInstance().emitOpen();

      lastInstance().emitError(FakeEventSource.CLOSED);

      expect(result.current.status).toBe("closed");
    });
  });

  describe("messages", () => {
    it("adds a valid message to entries", () => {
      const { result } = render();

      lastInstance().emitMessage(logJson("a"));

      expect(result.current.entries.map((e) => e.id)).toEqual(["a"]);
      expect(result.current.ignored).toBe(0);
    });

    it("counts a garbage message as ignored without adding an entry", () => {
      const { result } = render();

      lastInstance().emitMessage("not json at all");
      lastInstance().emitMessage('{"id": 1}');

      expect(result.current.entries).toEqual([]);
      expect(result.current.ignored).toBe(2);
    });
  });

  describe("reconnect", () => {
    it("closes the current connection, opens a new one and keeps entries", () => {
      const { result } = render();
      lastInstance().emitMessage(logJson("a"));

      act(() => result.current.reconnect());

      expect(FakeEventSource.instances).toHaveLength(2);
      expect(FakeEventSource.instances[0].close).toHaveBeenCalledTimes(1);
      expect(FakeEventSource.instances[1].close).not.toHaveBeenCalled();
      expect(result.current.entries.map((e) => e.id)).toEqual(["a"]);
    });

    it("goes back to connecting until the new connection opens", () => {
      const { result } = render();
      FakeEventSource.instances[0].emitOpen();
      expect(result.current.status).toBe("live");

      act(() => result.current.reconnect());
      expect(result.current.status).toBe("connecting");

      FakeEventSource.instances[1].emitOpen();
      expect(result.current.status).toBe("live");
    });
  });

  describe("lifecycle", () => {
    it("closes the old connection and opens a new one when the level changes", () => {
      const { rerender } = render("all");

      rerender({ level: "error" });

      expect(FakeEventSource.instances).toHaveLength(2);
      expect(FakeEventSource.instances[0].close).toHaveBeenCalledTimes(1);
      expect(new URL(FakeEventSource.instances[1].url).searchParams.get("level")).toBe("error");
    });

    it("does not reconnect on re-render with the same level", () => {
      const { rerender } = render("info");

      rerender({ level: "info" });

      expect(FakeEventSource.instances).toHaveLength(1);
      expect(FakeEventSource.instances[0].close).not.toHaveBeenCalled();
    });

    it("closes the connection on unmount", () => {
      const { unmount } = render();

      unmount();

      expect(FakeEventSource.instances).toHaveLength(1);
      expect(FakeEventSource.instances[0].close).toHaveBeenCalledTimes(1);
      expect(FakeEventSource.instances[0].readyState).toBe(FakeEventSource.CLOSED);
    });
  });
});
