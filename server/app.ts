import { Hono } from "hono";
import { convertInputSchema } from "../src/contracts.ts";

const app = new Hono();

app.get("/api/:endpoint", async (context) => {
  const endpoint = context.req.param("endpoint");
  if (endpoint !== "currencies" && endpoint !== "convert") return context.notFound();

  const key = process.env.CURRENCYBEACON_API_KEY?.trim();
  if (!key) return context.json({ error: "Conversion service is unavailable" }, 503);

  const url = new URL(`https://api.currencybeacon.com/v1/${endpoint}`);
  if (endpoint === "convert") {
    const query = context.req.query();
    const input = convertInputSchema.safeParse({
      from: query.from,
      to: query.to,
      amount: query.amount?.trim() ? Number(query.amount) : NaN,
    });
    if (!input.success) {
      return context.json({ error: "Conversion requires currencies and a finite amount" }, 400);
    }
    url.search = new URLSearchParams({
      from: input.data.from,
      to: input.data.to,
      amount: String(input.data.amount),
    }).toString();
  }

  const timeout = AbortSignal.timeout(10_000);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.any([context.req.raw.signal, timeout]),
      redirect: "error",
    });
    const headers = new Headers({
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    });
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) headers.set("Retry-After", retryAfter);
    const body = response.body ? await response.arrayBuffer() : null;
    return new Response(body, { status: response.status, headers });
  } catch {
    return timeout.aborted
      ? context.json({ error: "Conversion service timed out" }, 504)
      : context.json({ error: "Unable to reach conversion service" }, 502);
  }
});

export default app;
