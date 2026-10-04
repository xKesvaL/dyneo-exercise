import { useState } from "react";
import { IconAlertCircle, IconPlayerPause, IconPlayerPlay, IconRefresh } from "@tabler/icons-react";
import { cn } from "cn";
import { LogList } from "@/components/logs/LogList";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVELS, type ConnectionStatus, type Level } from "@/lib/config";
import { useLogStream } from "./hooks/use-log-stream";

const STATUS: Record<ConnectionStatus, { label: string; dot: string; pulse?: boolean }> = {
  connecting: { label: "Connecting…", dot: "bg-amber-500", pulse: true },
  live: { label: "Live", dot: "bg-emerald-500", pulse: true },
  reconnecting: { label: "Reconnecting…", dot: "bg-amber-500", pulse: true },
  closed: { label: "Offline", dot: "bg-red-500" },
};

const levelsLabel = (levels: Level[]) => {
  if (levels.length === 0) return "Everything";
  return LEVELS.filter((l) => levels.includes(l.value))
    .map((l) => l.label)
    .join(", ");
};

const entriesLabel = (n: number) => `${n.toLocaleString()} ${n === 1 ? "entry" : "entries"}`;

function App() {
  const [levels, setLevels] = useState<Level[]>([]);
  const { status, entries, following, newWhilePaused, ignored, pause, resume, reconnect } =
    useLogStream(levels);
  const busy = status === "connecting" || status === "reconnecting";

  return (
    <div className="mx-auto flex h-screen max-w-5xl flex-col gap-4 py-4">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <h1 className="text-xl font-semibold">Activity log</h1>
            <p className="text-sm text-muted-foreground">
              A live feed of what is happening. Select any line to see more.
            </p>
          </div>
          <div
            role="status"
            className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
          >
            <span className="relative flex size-2.5">
              {STATUS[status].pulse && (
                <span
                  className={cn(
                    "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                    STATUS[status].dot,
                  )}
                />
              )}
              <span
                className={cn("relative inline-flex size-2.5 rounded-full", STATUS[status].dot)}
              />
            </span>
            {STATUS[status].label}
            {status === "reconnecting" && (
              <Button size="xs" variant="ghost" onClick={reconnect}>
                Reconnect now
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span id="filter-label" className="text-sm text-muted-foreground">
              Show
            </span>
            <Select multiple value={levels} onValueChange={(value) => setLevels(value as Level[])}>
              <SelectTrigger aria-labelledby="filter-label" className="min-w-44">
                <SelectValue>{levelsLabel(levels)}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start" className="min-w-56">
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value} title={l.hint}>
                    <l.icon aria-hidden className={l.tone.icon} />
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {levels.length > 0 && (
              <Button size="xs" variant="ghost" onClick={() => setLevels([])}>
                Show everything
              </Button>
            )}
          </div>

          {following ? (
            <Button variant="outline" onClick={pause}>
              <IconPlayerPause data-icon="inline-start" />
              Pause updates
            </Button>
          ) : (
            <Button onClick={resume}>
              <IconPlayerPlay data-icon="inline-start" />
              Resume updates
            </Button>
          )}
        </div>
      </header>

      {status === "closed" && (
        <Alert variant="destructive" className="mx-4 mb-3 w-auto">
          <IconAlertCircle />
          <AlertTitle>We lost the connection</AlertTitle>
          <AlertDescription>
            We tried to reconnect a few times without success. New activity can’t be shown right
            now, but what you see below is still available.
          </AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline" onClick={reconnect}>
              <IconRefresh data-icon="inline-start" />
              Try again
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!following && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 border-y bg-muted px-4 py-2 text-sm"
        >
          <span>
            <strong className="font-medium">Updates are paused.</strong>{" "}
            {newWhilePaused > 0
              ? `${newWhilePaused.toLocaleString()} new ${newWhilePaused === 1 ? "entry is" : "entries are"} waiting.`
              : "Nothing new yet."}
          </span>
          <Button size="xs" onClick={resume}>
            {newWhilePaused > 0 ? "Show latest" : "Resume"}
          </Button>
        </div>
      )}

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
}

export default App;
