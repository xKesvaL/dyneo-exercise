import { useState } from "react";
import { cn } from "cn";
import { Separator } from "@/components/ui/separator";
import type { Level } from "@/lib/config";
import { useLogStream } from "@/hooks/use-log-stream";
import { LogHeader } from "./LogHeader";
import { LogList } from "./LogList";
import { ConnectionLostAlert, PausedBanner } from "./LogNotices";

const entriesLabel = (n: number) => `${n.toLocaleString()} ${n === 1 ? "entry" : "entries"}`;

// Self-contained live log feed. It fills its parent's height, so give it a flex/sized container.
export const LogViewer = ({ className }: { className?: string }) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const { status, entries, following, newWhilePaused, ignored, pause, resume, reconnect } =
    useLogStream(levels);
  const busy = status === "connecting" || status === "reconnecting";

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      <LogHeader
        status={status}
        levels={levels}
        following={following}
        onLevelsChange={setLevels}
        onPause={pause}
        onResume={resume}
        onReconnect={reconnect}
      />

      {status === "closed" && <ConnectionLostAlert onRetry={reconnect} />}
      {!following && <PausedBanner newCount={newWhilePaused} onResume={resume} />}

      <Separator />
      <LogList
        entries={entries}
        following={following}
        loading={busy}
        filtered={levels.length > 0}
      />
      <Separator />

      <footer className="flex flex-wrap justify-between gap-x-4 px-4 py-2 text-xs text-muted-foreground">
        <span>Showing {entriesLabel(entries.length)}</span>
        {ignored > 0 && <span>Skipped {entriesLabel(ignored)} that couldn’t be read</span>}
      </footer>
    </div>
  );
};
