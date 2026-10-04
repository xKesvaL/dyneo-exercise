import { describe, expect, it } from "vite-plus/test";
import { formatDuration, metadataRows, serviceName } from "./log-format";

describe("serviceName", () => {
  it("turns slugs into readable names", () => {
    expect(serviceName("user-service")).toBe("User service");
    expect(serviceName("payment_gateway")).toBe("Payment gateway");
  });

  it("returns null when there is no service", () => {
    expect(serviceName(null)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("avoids raw milliseconds", () => {
    expect(formatDuration(53)).toBe("under 1 second");
    expect(formatDuration(1439)).toBe("1.4 seconds");
  });
});

describe("metadataRows", () => {
  it("uses friendly labels and explains HTTP statuses", () => {
    expect(
      metadataRows({ request_id: "abc", user_id: 4, http_status: 404, extra_info: true }),
    ).toEqual([
      { key: "request_id", label: "Request ID", value: "abc" },
      { key: "user_id", label: "User ID", value: "4" },
      { key: "http_status", label: "Result", value: "Not found (404)" },
      { key: "extra_info", label: "Extra info", value: "true" },
    ]);
  });

  it("falls back to the status class for unknown codes", () => {
    expect(metadataRows({ http_status: 418 })[0].value).toBe("Request problem (418)");
  });
});
