import { createResponse } from "better-sse";
import { Hono } from "hono";
import { channel } from "../channels/test.js";

const app = new Hono();

app.get("/sse", (c) =>
  createResponse(c.req.raw, (session) => {
    channel.register(session);
  }),
);

export default app;
