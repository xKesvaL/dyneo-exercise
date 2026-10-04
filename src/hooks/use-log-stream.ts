import { useCallback, useEffect, useReducer, useState } from "react";
import { API_BASE_URL, TAIL, type ConnectionStatus, type Level } from "@/lib/config";
import { parseLog } from "@/lib/log-parser";
import { initialLogState, isFollowing, logReducer, visibleEntries } from "@/lib/log-reducer";

export const useLogStream = (level: Level | "all") => {
  const [state, dispatch] = useReducer(logReducer, initialLogState);
  const [attempt, setAttempt] = useState(0);
  const connectionKey = `${level}:${attempt}`;
  const [connection, setConnection] = useState<{ key: string; status: ConnectionStatus }>({
    key: connectionKey,
    status: "connecting",
  });
  const status = connection.key === connectionKey ? connection.status : "connecting";

  useEffect(() => {
    const url = new URL("/logs/stream", API_BASE_URL);
    url.searchParams.set("tail", String(TAIL));
    if (level !== "all") url.searchParams.set("level", level);

    const es = new EventSource(url);

    es.onopen = () => setConnection({ key: connectionKey, status: "live" });
    es.onmessage = (e) => {
      const entry = parseLog(e.data);
      if (entry) dispatch({ type: "received", entry });
      else dispatch({ type: "malformed" });
    };
    es.onerror = () => {
      const next = es.readyState === EventSource.CLOSED ? "closed" : "reconnecting";
      setConnection({ key: connectionKey, status: next });
    };

    return () => es.close();
  }, [level, attempt, connectionKey]);

  const pause = useCallback(() => dispatch({ type: "pause" }), []);
  const resume = useCallback(() => dispatch({ type: "resume" }), []);
  const reconnect = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    status,
    entries: visibleEntries(state),
    following: isFollowing(state),
    newWhilePaused: state.newWhilePaused,
    ignored: state.ignored,
    pause,
    resume,
    reconnect,
  };
};
