import { IconBug, IconExclamationCircle, IconInfoCircle, type Icon } from "@tabler/icons-react";
import * as z from "zod";
import colors from "tailwindcss/colors";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://technical-exercise.dyneo.io";

// TAIL <= MAX_ENTRIES
export const TAIL = 200;

export const MAX_ENTRIES = 1000;

export const logSchema = z.object({
  id: z.string(),
  timestamp: z.iso.datetime(),
  date: z.coerce.date(),
  level: z.enum(["debug", "info", "warning", "error", "critical"]),
  message: z.string(),
  service: z.string().nullable(),
  durationMs: z.number().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  raw: z.unknown(),
});

export type LogEntry = z.infer<typeof logSchema>;

export type Level = LogEntry["level"];

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
