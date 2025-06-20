import { serve } from "@hono/node-server";
import { Hono } from "hono";
import "dotenv/config";
import db from "./database/index.js";

const app = new Hono();

app.get("/", async (c) => {
  const response = await db.query.users.findMany();
  return c.json(response);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
