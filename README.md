# Log viewer

A live log viewer for technicians that provides easily readable information, with details on demand.

Available at [https://dyneo.kesval.com](https://dyneo.kesval.com)

## Run it

Requires [Bun](https://bun.sh). (also works with Node / npm)

```sh
bun install
# or npm install
bun run dev           # http://localhost:5173
# or npm run dev
```

Other commands:

```sh
bun run test         # unit tests (Vitest)
bun run test:e2e     # end-to-end tests (Playwright)
bun run check         # format + lint + type check
bun run build         # production build in dist/
# or npm ...
```

The API URL comes from `VITE_API_BASE_URL` in [.env](./.env)

End-to-end tests run in Chromium against a local mock of the logs API (`e2e/mock-api.mjs`), so they are offline and deterministic. Playwright starts the mock API and the app (`vp dev --mode testing`, which loads [.env.testing](./.env.testing)) by itself. The first time, install the browser with `bunx playwright install chromium`.

### What it does

- **Live feed**: the last 500 entries are loaded, then new ones stream in, capped at 1000.
- **Readable lines**: a clear way to see what happened, with the most important information first
- **Details**: click a line to see the data ; "Show technical details" reveals the raw data, and "Copy for support" copies it.
- **Level filter**: multi-select. You can for example select only `error` and `critical` to focus on the most important entries.
- **Pause / resume**: freezes the list so you can read, also works when you scroll up.
- **Connection status**: live / reconnecting / offline, with automatic retries (3s, 10s, 30s) in case of network issues.

## Dev part / Structure

```text
src/lib/log-parser.ts    JSON -> validated LogEntry (zod); snake_case -> camelCase
src/lib/log-reducer.ts   pure state: buffer, dedupe by id, pause snapshot
src/lib/log-format.ts    human wording for services, durations, metadata
src/hooks/use-log-stream.ts  EventSource lifecycle, retries, filtering
src/components/logs/     LogList (scroll behaviour) and LogRow (one entry)
```

Logic is kept out of components (parser, reducer, formatters are pure and unit-tested), which makes it easier to think about it and test.

## Choices and trade-offs

- **SSE over NDJSON**: EventSource gives native streaming and reconnection, and is globally more efficient.
- **Zod**: Zod helps keep types easy to maintain, and it helps with validating the incoming data, in case it ever changes.
- **No virtualisation**: Since we kept only 1000 entries, not using virtualisation is fine. This would be the next step if we wanted to keep / show more entries.
- **Client-sided filters**: simpler than opening a new connection for each filter change, and allows an easy way to select multiple levels. The downside is the client always receives all entries, but it's not an issue for this size of data.
- **UI kit**: shadcn/ui (Base UI + Tailwind) for nice primitives, like the multi-select.
- **Language**: the UI is in English, and dates are numeric and language-neutral (`DD/MM/YYYY HH:mm:ss`, 24h, local timezone), this avoids the issue with YYYY/MM/DD vs YYYY/DD/MM.
