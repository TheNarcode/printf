import { Hono } from "hono";
import { orderChannel } from "../channels/orderChannel.js";

const app = new Hono();

// undo commit for this file
app.post(async (c) => {
  // console.log(await c.headers);
  const datax = {
    file: "0282fb6a-74a7-476c-aca1-18ada44593d8",
    orientation: "4",
    color: "Monochrome",
    copies: "1",
    paperFormat: "iso_a4_210x297mm",
    pageRanges: "1,3",
    numberUp: "1",
    sides: "one-sided",
  };
  orderChannel.broadcast(datax, "update");
  return c.text("hello");
});

export default app;
