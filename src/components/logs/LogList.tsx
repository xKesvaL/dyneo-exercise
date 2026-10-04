import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconArrowDown, IconListDetails } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { LogEntry } from "@/lib/config";
import { LogRow } from "./LogRow";

const NEAR_BOTTOM_PX = 80;

interface LogListProps {
  entries: LogEntry[];
  following: boolean;
  loading: boolean;
  filtered: boolean;
}

export const LogList = ({ entries, following, loading, filtered }: LogListProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const empty = entries.length === 0;

  const getViewport = () =>
    rootRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null;

  const jumpToLatest = () => {
    const viewport = getViewport();
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
    setAtBottom(true);
  };

  // Resuming after a pause brings the reader back to the newest entry.
  const [wasFollowing, setWasFollowing] = useState(following);
  if (following !== wasFollowing) {
    setWasFollowing(following);
    if (following) setAtBottom(true);
  }

  // Auto-scroll only while the reader is at the bottom; entries keep arriving either way.
  useLayoutEffect(() => {
    const viewport = getViewport();
    if (following && atBottom && viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [entries, following, atBottom]);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;
    const onScroll = () => {
      const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setAtBottom(distance <= NEAR_BOTTOM_PX);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [empty]);

  if (empty) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">{loading ? <Spinner /> : <IconListDetails />}</EmptyMedia>
          <EmptyTitle>
            {loading ? "Getting the latest activity…" : "Nothing to show yet"}
          </EmptyTitle>
          <EmptyDescription>
            {filtered
              ? "No activity of the selected types so far. Try “Show everything” to see all activity."
              : "New activity will appear here as soon as it happens."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollArea ref={rootRef} className="min-h-0 flex-1">
        <ul>
          {entries.map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </ScrollArea>
      {following && !atBottom && (
        <Button
          size="sm"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 shadow-md"
          onClick={jumpToLatest}
        >
          <IconArrowDown data-icon="inline-start" />
          Jump to latest
        </Button>
      )}
    </div>
  );
};
