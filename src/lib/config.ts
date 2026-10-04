import { IconBug, IconExclamationCircle, IconInfoCircle, type Icon } from "@tabler/icons-react";
import colors from "tailwindcss/colors";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://technical-exercise.dyneo.io";

export const TAIL = 200;

export const MAX_ENTRIES = 1000;

export type Level = "debug" | "info" | "warning" | "error" | "critical";

export interface LogEntry {
  id: string;
  timestamp: string; // raw ISO string
  date: Date; // parsed
  level: Level;
  message: string;
  service: string | null;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  raw: unknown;
}

export type ConnectionStatus = "connecting" | "live" | "reconnecting" | "closed";

type LevelList = Array<{
  value: Level;
  label: string;
  icon: Icon;
  color: keyof typeof colors | "primary" | "secondary" | "danger";
}>;

export const LEVELS: LevelList = [
  { value: "debug", label: "Debug", icon: IconBug, color: "violet" },
  { value: "info", label: "Info", icon: IconInfoCircle, color: "primary" },
  { value: "warning", label: "Warning", icon: IconExclamationCircle, color: "yellow" },
  { value: "error", label: "Error", icon: IconExclamationCircle, color: "orange" },
  { value: "critical", label: "Critical", icon: IconExclamationCircle, color: "danger" },
];
