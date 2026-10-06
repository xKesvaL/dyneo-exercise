const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const words = (text: string) => text.replace(/[-_]+/g, " ").trim();

// "user-service" -> "User service"
export const serviceName = (service: string | null) =>
  service ? capitalize(words(service)) : null;

export const formatDuration = (ms: number) => {
  if (ms < 1000) return "under 1 second";
  return `${(ms / 1000).toFixed(1)} seconds`;
};

const HTTP_STATUS: Record<number, string> = {
  200: "Success",
  201: "Created",
  204: "Success",
  400: "Invalid request",
  401: "Not signed in",
  403: "Not allowed",
  404: "Not found",
  408: "Timed out",
  409: "Conflict",
  422: "Invalid data",
  429: "Too many requests",
  500: "Server error",
  502: "Service unavailable",
  503: "Service unavailable",
  504: "Timed out",
};

const httpStatusText = (code: number) => {
  const known = HTTP_STATUS[code];
  if (known) return `${known} (${code})`;
  if (code >= 200 && code < 300) return `Success (${code})`;
  if (code >= 400 && code < 500) return `Request problem (${code})`;
  if (code >= 500 && code < 600) return `Server error (${code})`;
  return String(code);
};

const METADATA_LABELS: Record<string, string> = {
  request_id: "Request ID",
  user_id: "User ID",
  http_status: "Result",
};

const formatValue = (key: string, value: unknown) => {
  if (key === "http_status" && typeof value === "number") return httpStatusText(value);
  if (value === null || value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
};

export const metadataRows = (metadata: Record<string, unknown>) =>
  Object.entries(metadata).map(([key, value]) => ({
    key,
    label: METADATA_LABELS[key] ?? capitalize(words(key)),
    value: formatValue(key, value),
  }));

const pad = (n: number) => String(n).padStart(2, "0");

export const formatTime = (date: Date) =>
  Number.isNaN(date.getTime())
    ? "--:--:--"
    : `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

export const formatDateTime = (date: Date, fallback: string) =>
  Number.isNaN(date.getTime())
    ? fallback
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${formatTime(date)}`;
