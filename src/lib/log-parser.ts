import { logSchema, type LogEntry } from "./config";

const normalize = (wire: Record<string, unknown>) => {
  const { duration_ms, ...rest } = wire;
  return {
    date: wire.timestamp,
    raw: wire,
    ...(duration_ms !== undefined && { durationMs: duration_ms }),
    ...rest,
  };
};

export const parseLog = (data: string): LogEntry | null => {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    // uses schema to validate parsed data, it will either return the data as a LogEntry or throw an error if the data is invalid
    return logSchema.parse(normalize(parsed));
  } catch {
    return null;
  }
};
