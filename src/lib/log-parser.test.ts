import { describe, expect, it } from "vite-plus/test";
import { parseLog } from "./log-parser";

const validEntry = {
  id: "log-1",
  timestamp: "2026-10-04T12:00:00.000Z",
  date: new Date("2026-10-04T12:00:00.000Z"),
  level: "info",
  message: "Server started",
  service: "api",
  durationMs: 42,
  metadata: { region: "eu-west-1" },
  raw: { anything: true },
};

describe("parseLog", () => {
  describe("invalid input", () => {
    it.each([
      ["an empty string", ""],
      ["malformed JSON", "{not json"],
      ["a truncated JSON object", '{"id": "log-1", "message":'],
      ["plain text", "just a log line"],
    ])("returns null for %s", (_label, input) => {
      expect(parseLog(input)).toBeNull();
    });

    it.each([
      ["a number", "42"],
      ["a string", '"hello"'],
      ["a boolean", "true"],
      ["null", "null"],
    ])("returns null when JSON is %s", (_label, input) => {
      expect(parseLog(input)).toBeNull();
    });

    it("returns null for a JSON array", () => {
      expect(parseLog("[]")).toBeNull();
    });

    it("returns null for an empty object", () => {
      expect(parseLog("{}")).toBeNull();
    });
  });

  describe("schema validation", () => {
    it("returns null for an invalid date", () => {
      expect(parseLog(JSON.stringify({ ...validEntry, date: "not a date" }))).toBeNull();
    });

    it.each(["id", "timestamp", "date", "level", "message", "metadata"] as const)(
      "returns null when required field %s is missing",
      (field) => {
        const { [field]: _removed, ...rest } = validEntry;
        expect(parseLog(JSON.stringify(rest))).toBeNull();
      },
    );

    it("returns null for an unknown level", () => {
      expect(parseLog(JSON.stringify({ ...validEntry, level: "fatal" }))).toBeNull();
    });

    it("returns null for a non-ISO timestamp", () => {
      expect(parseLog(JSON.stringify({ ...validEntry, timestamp: "yesterday" }))).toBeNull();
    });

    it("returns null when durationMs is not a number", () => {
      expect(parseLog(JSON.stringify({ ...validEntry, durationMs: "42" }))).toBeNull();
    });

    it("returns null when metadata is not an object", () => {
      expect(parseLog(JSON.stringify({ ...validEntry, metadata: "nope" }))).toBeNull();
    });

    it("returns null when service is not a string or null", () => {
      expect(parseLog(JSON.stringify({ ...validEntry, service: 5 }))).toBeNull();
    });
  });

  describe("valid input", () => {
    it.each(["debug", "info", "warning", "error", "critical"])("accepts the %s level", (level) => {
      const result = parseLog(JSON.stringify({ ...validEntry, level }));
      expect(result?.level).toBe(level);
    });

    it("parses a fully populated entry", () => {
      const result = parseLog(JSON.stringify(validEntry));
      expect(result).toMatchObject({
        id: "log-1",
        timestamp: validEntry.timestamp,
        level: "info",
        message: "Server started",
        service: "api",
        durationMs: 42,
        metadata: { region: "eu-west-1" },
      });
    });

    it("coerces the serialized date back into a Date", () => {
      const result = parseLog(JSON.stringify(validEntry));
      expect(result?.date).toBeInstanceOf(Date);
      expect(result?.date.toISOString()).toBe(validEntry.timestamp);
    });

    it("accepts null service and durationMs", () => {
      const result = parseLog(JSON.stringify({ ...validEntry, service: null, durationMs: null }));
      expect(result).toMatchObject({ service: null, durationMs: null });
    });
  });
});
