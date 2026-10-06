import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { ConnectionStatus, Level } from "@/lib/config";
import { LevelFilter } from "./LevelFilter";

const STATUS: Record<ConnectionStatus, { label: string; dot: string; pulse?: boolean }> = {
  connecting: { label: "Connecting…", dot: "bg-amber-500", pulse: true },
  live: { label: "Live", dot: "bg-emerald-500", pulse: true },
  reconnecting: { label: "Reconnecting…", dot: "bg-amber-500", pulse: true },
  closed: { label: "Offline", dot: "bg-red-500" },
};

interface LogHeaderProps {
  status: ConnectionStatus;
  levels: Level[];
  following: boolean;
  onLevelsChange: (levels: Level[]) => void;
  onPause: () => void;
  onResume: () => void;
  onReconnect: () => void;
}

export const LogHeader = ({
  status,
  levels,
  following,
  onLevelsChange,
  onPause,
  onResume,
  onReconnect,
}: LogHeaderProps) => {
  const { label, dot, pulse } = STATUS[status];

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <LevelFilter levels={levels} onChange={onLevelsChange} />
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="status"
          className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
        >
          <span className="relative flex size-2.5">
            {pulse && (
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                  dot,
                )}
              />
            )}
            <span className={cn("relative inline-flex size-2.5 rounded-full", dot)} />
          </span>
          {label}
          {status === "reconnecting" && (
            <Button size="xs" variant="ghost" onClick={onReconnect}>
              Reconnect now
            </Button>
          )}
        </div>
        {following ? (
          <Button variant="outline" onClick={onPause}>
            <IconPlayerPause data-icon="inline-start" />
            Pause updates
          </Button>
        ) : (
          <Button onClick={onResume}>
            <IconPlayerPlay data-icon="inline-start" />
            Resume updates
          </Button>
        )}
      </div>
    </div>
  );
};
