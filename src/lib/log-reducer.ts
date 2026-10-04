import { MAX_ENTRIES, type LogEntry } from "./config";

export interface LogState {
  entries: LogEntry[]; // live buffer, ≤ MAX_ENTRIES, arrival order
  snapshot: LogEntry[] | null; // non-null ⇔ paused; what the list shows
  newWhilePaused: number;
  ignored: number;
}

export type LogAction =
  | { type: "received"; entry: LogEntry }
  | { type: "malformed" }
  | { type: "pause" }
  | { type: "resume" };

export const initialLogState: LogState = {
  entries: [],
  snapshot: null,
  newWhilePaused: 0,
  ignored: 0,
};

export const logReducer = (state: LogState, action: LogAction): LogState => {
  switch (action.type) {
    case "received": {
      const { entry } = action;
      if (state.entries.some((e) => e.id === entry.id)) return state;

      return {
        ...state,
        entries: [...state.entries, entry].slice(-MAX_ENTRIES),
        newWhilePaused: state.snapshot !== null ? state.newWhilePaused + 1 : state.newWhilePaused,
      };
    }
    case "malformed":
      return { ...state, ignored: state.ignored + 1 };
    case "pause":
      if (state.snapshot !== null) return state;
      return { ...state, snapshot: state.entries, newWhilePaused: 0 };
    case "resume":
      return { ...state, snapshot: null, newWhilePaused: 0 };
  }
};

export const visibleEntries = (state: LogState): LogEntry[] => state.snapshot ?? state.entries;

export const isFollowing = (state: LogState): boolean => state.snapshot === null;
