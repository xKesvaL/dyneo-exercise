import {
  IconAlertCircle,
  IconAlertOctagon,
  IconAlertTriangle,
  IconBug,
  IconInfoCircle,
  type Icon,
} from "@tabler/icons-react";
import * as z from "zod";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://technical-exercise.dyneo.io";

// TAIL <= MAX_ENTRIES
export const TAIL = 500;

export const MAX_ENTRIES = 1000;

// Wait times before each automatic reconnect attempt after the connection is lost.
export const RECONNECT_DELAYS_MS = [3_000, 10_000, 30_000];

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
  hint: string;
  icon: Icon;
  tone: { stripe: string; icon: string; badge: string; row: string };
}>;

export const LEVELS: LevelList = [
  {
    value: "debug",
    label: "Detail",
    hint: "Fine-grained information, mostly useful to technical teams.",
    icon: IconBug,
    tone: {
      stripe: "border-l-violet-400",
      icon: "text-violet-600 dark:text-violet-400",
      badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
      row: "",
    },
  },
  {
    value: "info",
    label: "Info",
    hint: "Something happened and everything is fine.",
    icon: IconInfoCircle,
    tone: {
      stripe: "border-l-sky-400",
      icon: "text-sky-600 dark:text-sky-400",
      badge: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
      row: "",
    },
  },
  {
    value: "warning",
    label: "Warning",
    hint: "Something looks off but it is still working. Worth keeping an eye on.",
    icon: IconAlertTriangle,
    tone: {
      stripe: "border-l-amber-400",
      icon: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
      row: "bg-amber-50/60 dark:bg-amber-500/5",
    },
  },
  {
    value: "error",
    label: "Error",
    hint: "Something failed and needs attention.",
    icon: IconAlertCircle,
    tone: {
      stripe: "border-l-red-500",
      icon: "text-red-600 dark:text-red-400",
      badge: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
      row: "bg-red-50/70 dark:bg-red-500/10",
    },
  },
  {
    value: "critical",
    label: "Critical",
    hint: "A serious failure that needs immediate attention.",
    icon: IconAlertOctagon,
    tone: {
      stripe: "border-l-red-700",
      icon: "text-red-700 dark:text-red-300",
      badge: "bg-red-700 text-white dark:bg-red-600",
      row: "bg-red-100/70 dark:bg-red-500/15",
    },
  },
];
