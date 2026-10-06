// Minimal stand-in for the logs API, so e2e tests are deterministic and offline.
//   GET  /logs/stream?tail=&level=   SSE stream (same contract as the real API)
//   POST /__test/entries             body: { entries: [...], raw?: [...] } store + broadcast
//   POST /__test/reset               clear entries, drop clients, stop refusing
//   POST /__test/refuse              body: { refuse: boolean } make /logs/stream fail
//   GET  /__test/requests            stream URLs requested so far
import { createServer } from "node:http";

const port = Number(process.env.MOCK_API_PORT ?? 4010);

let entries = [];
let clients = new Set();
let refuse = false;
let requests = [];

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

const sse = (data) => `data: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`;

const matches = (client, entry) => !client.level || entry.level === client.level;

const dropClients = () => {
  for (const client of clients) client.res.destroy();
  clients = new Set();
};

const readBody = async (req) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
};

const json = (res, body = {}) => {
  res.writeHead(200, { ...cors, "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (url.pathname === "/logs/stream") {
    requests.push(url.pathname + url.search);
    if (refuse) {
      res.writeHead(503, cors);
      res.end();
      return;
    }

    const level = url.searchParams.get("level");
    const tail = Number(url.searchParams.get("tail") ?? entries.length);
    const client = { res, level };
    res.writeHead(200, {
      ...cors,
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    res.write(":ok\n\n");
    for (const entry of entries.filter((e) => matches(client, e)).slice(-tail)) {
      res.write(sse(entry));
    }
    clients.add(client);
    req.on("close", () => clients.delete(client));
    return;
  }

  if (url.pathname === "/__test/entries" && req.method === "POST") {
    const body = await readBody(req);
    for (const entry of body.entries ?? []) {
      entries.push(entry);
      for (const client of clients) if (matches(client, entry)) client.res.write(sse(entry));
    }
    for (const raw of body.raw ?? []) for (const client of clients) client.res.write(sse(raw));
    return json(res);
  }

  if (url.pathname === "/__test/reset" && req.method === "POST") {
    entries = [];
    refuse = false;
    requests = [];
    dropClients();
    return json(res);
  }

  if (url.pathname === "/__test/refuse" && req.method === "POST") {
    refuse = Boolean((await readBody(req)).refuse);
    if (refuse) dropClients();
    return json(res);
  }

  if (url.pathname === "/__test/requests") return json(res, requests);

  res.writeHead(404, cors);
  res.end();
});

server.listen(port, () => console.log(`Mock logs API listening on http://localhost:${port}`));
