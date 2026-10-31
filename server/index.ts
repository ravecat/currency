import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./app.ts";

app.use("*", serveStatic({ root: "./dist" }));

const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) }, ({ port }) =>
  console.log(`Currency server listening on http://localhost:${port}`),
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close());
}
