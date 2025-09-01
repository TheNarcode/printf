import { Hono } from "hono";

const app = new Hono();

app.post(async (c) => {
  // console.log(await c.headers);
  console.dir(await c.req.json(), { depth: 10 });
  return c.text("hello");
});

export default app;
