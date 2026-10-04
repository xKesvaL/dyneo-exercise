import { logSchema, type LogEntry } from "./config";

export const parseLog = (data: string): LogEntry | null => {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    // uses schema to validate parsed data, it will either return the data as a LogEntry or throw an error if the data is invalid
    return logSchema.parse(parsed);
  } catch {
    return null;
  }
};
