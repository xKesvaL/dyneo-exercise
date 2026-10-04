import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  API_BASE_URL,
  RECONNECT_DELAYS_MS,
  TAIL,
  type ConnectionStatus,
  type Level,
  type LogEntry,
} from "@/lib/config";
import { parseLog } from "@/lib/log-parser";
import { initialLogState, isFollowing, logReducer, visibleEntries } from "@/lib/log-reducer";

// An empty `levels` means every level. The API only filters by a single level, so any other
// selection is streamed unfiltered and narrowed down here.
export const useLogStream = (levels: readonly Level[]) => {
  const level: Level | "all" = levels.length === 1 ? levels[0] : "all";
  const [state, dispatch] = useReducer(logReducer, initialLogState);
  const [attempt, setAttempt] = useState(0);
  const retries = useRef({ level, count: 0 });
  const connectionKey = `${level}:${attempt}`;
  const [connection, setConnection] = useState<{ key: string; status: ConnectionStatus }>({
    key: connectionKey,
    status: "connecting",
  });
  const status = connection.key === connectionKey ? connection.status : "connecting";

  useEffect(() => {
    if (retries.current.level !== level) retries.current = { level, count: 0 };

    const url = new URL("/logs/stream", API_BASE_URL);
    url.searchParams.set("tail", String(TAIL));
    if (level !== "all") url.searchParams.set("level", level);

    const es = new EventSource(url);
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    es.onopen = () => {
      retries.current.count = 0;
      setConnection({ key: connectionKey, status: "live" });
    };
    es.onmessage = (e) => {
      const entry = parseLog(e.data);
      if (entry) dispatch({ type: "received", entry });
      else {
        console.error("Malformed log entry ignored:", e.data);
        dispatch({ type: "malformed" });
      }
    };
    es.onerror = () => {
      // While CONNECTING the browser is already retrying by itself.
      if (es.readyState !== EventSource.CLOSED) {
        setConnection({ key: connectionKey, status: "reconnecting" });
        return;
      }

      const delay = RECONNECT_DELAYS_MS[retries.current.count];
      if (delay === undefined) {
        setConnection({ key: connectionKey, status: "closed" });
        return;
      }
      retries.current.count += 1;
      setConnection({ key: connectionKey, status: "reconnecting" });
      retryTimer = setTimeout(() => setAttempt((n) => n + 1), delay);
    };

    return () => {
      clearTimeout(retryTimer);
      es.close();
    };
  }, [level, attempt, connectionKey]);

  const entries = useMemo(() => {
    const matches = (e: LogEntry) => levels.length === 0 || levels.includes(e.level);
    return visibleEntries(state).filter(matches);
  }, [state, levels]);

  const newWhilePaused = useMemo(() => {
    if (levels.length === 0 || state.snapshot === null) return state.newWhilePaused;
    const seen = new Set(state.snapshot.map((e) => e.id));
    return state.entries.filter((e) => levels.includes(e.level) && !seen.has(e.id)).length;
  }, [state, levels]);

  const pause = useCallback(() => dispatch({ type: "pause" }), []);
  const resume = useCallback(() => dispatch({ type: "resume" }), []);
  const reconnect = useCallback(() => {
    retries.current.count = 0;
    setAttempt((n) => n + 1);
  }, []);

  return {
    status,
    entries,
    following: isFollowing(state),
    newWhilePaused,
    ignored: state.ignored,
    pause,
    resume,
    reconnect,
  };
};
