import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";
import db from "./database/index.js";
import applicationRouter from "./routes/application.js";
import uploadRouter from "./routes/upload.js";
import orderEvent from "./routes/orderEvent.js";
import webHook from "./routes/webhook.js";

const app = new Hono();

app.route("/application", applicationRouter);
app.route("/files", uploadRouter);
app.route("/event", orderEvent);
app.route("/webhook", webHook);

app.get("/", async (c) => {
  const response = await db.query.users.findMany();
  return c.json(response);
});

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
